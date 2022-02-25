import { Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { renderMedia } from './renderer';
import fs from 'fs';

const s3 = new S3();

export const generateMetadata: Handler = async (event: any) => {
    const body = JSON.parse(event.body);
    const to = body['event']['data']['new']['to'];
    const ivxId = body['event']['data']['new']['ivx_id'];
    const tokenId = parseInt(body['event']['data']['new']['token'], 16).toString();

    let responseBody = {
        address: to,
        ivxId: ivxId,
        tokenId: tokenId,
    };

    let response = {
        statusCode: 200,
        body: JSON.stringify(responseBody),
    };

    let completed = await generateJson(to, ivxId, tokenId);

    if (!completed) {
        throw new Error('Could not generate JSON');
    }

    return response;
};

const generateJson = async (address: string, id: string, tokenId: string) => {
    let metadata = {};

    console.log('here');

    metadata['name'] = 'IVX #' + tokenId;
    metadata['description'] = 'PROOF OF MEMBERSHIP TO IVX COLLECTIVE / PROOF OF OWNERSHIP FOR PHYSICAL GOOD';
    metadata['image'] = 'https://media.iv-x.xyz/' + tokenId + '.png';
    metadata['external_url'] = 'iv-x.xyz';
    metadata['attributes'] = [{ DROP: 'STRUCTURED CHAOS' }];
    metadata['creator'] = address;
    metadata['creatorIVxID'] = id;

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

    console.log('--- RENDERING ---');
    await renderMedia(creator, creatorId);

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
