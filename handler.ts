import { Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import fs from 'fs';
import keccak256 from 'keccak256';
import { renderMedia } from './renderer';
import { renderMedia as renderPrint } from './printRenderer';
import Random from './Random';

const s3 = new S3();

export const generateMetadata: Handler = async (event: any) => {
    const body = JSON.parse(event.body);
    const to = body['event']['data']['new']['to'];
    const ivxId = body['event']['data']['new']['ivx_id'];
    const transactionId = body['event']['data']['new']['id'];
    const tokenId = parseInt(body['event']['data']['new']['token'], 16).toString();

    let responseBody = {
        address: to,
        transactionId: transactionId,
        ivxId: ivxId,
        tokenId: tokenId,
    };

    let response = {
        statusCode: 200,
        body: JSON.stringify(responseBody),
    };

    let completed = await generateJson(to, transactionId, ivxId, tokenId);

    if (!completed) {
        throw new Error('Could not generate JSON');
    }

    return response;
};

export const redeemToken: Handler = async (event: any) => {
    const body = JSON.parse(event.body);
    const tokenId = parseInt(body['event']['data']['new']['token'], 16).toString();

    const bucket = 'token.iv-x.xyz';
    const key = tokenId;
    const params = {
        Bucket: bucket,
        Key: key,
    };

    let data: {};

    try {
        const response = await s3.getObject(params).promise();
        data = JSON.parse(response.Body.toString('utf-8'));

        console.log('FETCHED FROM BUCKET');
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }

    data['attributes'][1]['value'] = 'REDEEMED';

    console.log('--- UPLOADING ---');
    const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(data, null, 4),
        ContentType: 'application/json',
    };

    try {
        await s3.putObject(uploadParams).promise();
        console.log(`File uploaded successfully at https:/` + 'token.iv-x.xyz' + `/` + key);
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

const generateJson = async (address: string, transactionId: string, id: string, tokenId: string) => {
    let metadata = {};
    let attributes = [];
    attributes.push({ trait_type: 'DROP', value: 'STRUCTURED CHAOS' });
    attributes.push({ trait_type: 'REDEMPTION STATUS', value: 'NOT REDEEMED' });

    const transactionHash = '0x' + keccak256(transactionId + id + tokenId).toString('hex');
    console.log(transactionHash);
    let R = new Random(transactionHash);
    let colors = ['RED', 'PURPLE', 'BLUE', 'GREEN', 'YELLOW'];
    let rarity = 'NORMAL';

    let rare = R.random_bool(0.5);
    let outerColor = 'WHITE';
    let innerColor = 'WHITE';

    if (rare) {
        outerColor = R.random_choice(colors);
        let epic = R.random_bool(0.2);
        if (epic) {
            rarity = 'EPIC';
            innerColor = R.random_choice(
                colors.filter(function (ele) {
                    return ele != outerColor;
                })
            );
        } else {
            let ultraRare = R.random_bool(0.35);
            rarity = ultraRare ? 'ULTRA RARE' : 'RARE';
            innerColor = ultraRare ? outerColor : innerColor;
        }
    }

    attributes.push({ trait_type: 'RARITY', value: rarity });
    attributes.push({ trait_type: 'OUTER COLOR', value: outerColor });
    attributes.push({ trait_type: 'INNER COLOR', value: innerColor });

    let backOutput = '';
    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 22; j++) {
            let black = R.random_bool(0.1);
            backOutput += black ? '.' : '#';
        }

        backOutput += '\n';
    }

    metadata['name'] = 'IVX #' + tokenId;
    metadata['description'] = 'PROOF OF MEMBERSHIP TO IVX COLLECTIVE / PROOF OF OWNERSHIP FOR PHYSICAL GOOD';
    metadata['image'] = 'https://media.iv-x.xyz/' + tokenId + '.png';
    metadata['external_url'] = 'https://iv-x.xyz';
    metadata['attributes'] = attributes;
    metadata['creator'] = address;
    metadata['creatorIVxID'] = id;
    metadata['backPrint'] = backOutput;

    const objectData = JSON.stringify(metadata, null, 4);
    const bucketName = 'token.iv-x.xyz';
    const objectType = 'application/json';
    const objectName = tokenId;

    try {
        const params = {
            Bucket: bucketName,
            Key: objectName,
            Body: objectData,
            ContentType: objectType,
        };

        await s3.putObject(params).promise();
        console.log(`File uploaded successfully at https:/` + bucketName + `/` + objectName);

        return true;
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${objectName} from bucket ${bucketName}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

export const generateImage: Handler = async (event: any) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };

    let data: {};

    try {
        const response = await s3.getObject(params).promise();
        data = JSON.parse(response.Body.toString('utf-8'));

        console.log('FETCHED FROM BUCKET');
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }

    const creator = data['creator'];
    const creatorId = data['creatorIVxID'];
    const outsideColor = data['attributes'][3]['value'];
    const insideColor = data['attributes'][4]['value'];

    console.log('--- RENDERING ---');
    await renderMedia(creator, creatorId, key, outsideColor, insideColor);

    console.log('--- UPLOADING ---');
    const fileContent = fs.readFileSync('/tmp/tmp.png');
    const uploadParams = {
        Bucket: 'media.iv-x.xyz',
        Key: key + '.png',
        Body: fileContent,
        ContentType: 'image/png',
    };

    try {
        await s3.putObject(uploadParams).promise();
        console.log(`File uploaded successfully at https:/` + 'media.iv-x.xyz' + `/` + key + '.png');
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

export const generateFrontScreen: Handler = async (event: any) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: 'token.iv-x.xyz',
        Key: key.substring(0, key.length - 4),
    };

    let data: {};

    try {
        const response = await s3.getObject(params).promise();
        data = JSON.parse(response.Body.toString('utf-8'));

        console.log('FETCHED FROM BUCKET');
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }

    const creator = data['creator'];
    const creatorId = data['creatorIVxID'];
    const outsideColor = data['attributes'][3]['value'];
    const insideColor = data['attributes'][4]['value'];

    console.log('--- RENDERING ---');
    await renderPrint(creator, creatorId, key, outsideColor, insideColor);

    console.log('--- UPLOADING ---');
    const fileContent = fs.readFileSync('/tmp/tmp.png');
    const uploadParams = {
        Bucket: 'ivx-prints',
        Key: key,
        Body: fileContent,
        ContentType: 'image/png',
    };

    try {
        await s3.putObject(uploadParams).promise();
        console.log(`File uploaded successfully at https:/` + 'ivx-prints' + `/` + key + '.png');
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};
