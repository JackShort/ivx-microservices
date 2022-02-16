import { Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { Lambda } from 'aws-sdk';
import { GetItemInput } from 'aws-sdk/clients/dynamodb';

const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();

async function getItem(params: GetItemInput) {
    try {
        const data = await docClient.get(params).promise();
        return data;
    } catch (err) {
        return err;
    }
}

export const generateMetadata: Handler = async (event: any) => {
    const body = JSON.parse(event.body);
    const to = body['event']['data']['new']['to'];
    const ivxId = body['event']['data']['new']['ivx_id'];
    const tokenId = parseInt(body['event']['data']['new']['token'], 16).toString();

    const params = {
        TableName: 'ivx-status',
        Key: {
            tokenId: tokenId as any,
        },
    };

    let responseBody = {
        address: to,
        ivxId: ivxId,
        tokenId: tokenId,
    };

    let response = {
        statusCode: 200,
        body: JSON.stringify(responseBody),
    };

    try {
        console.log('before data');
        const data = await getItem(params);
        console.log('after data');
        console.log(data);

        if (Object.keys(data).length == 0) {
            console.log('BEFORE JSON');
            let completed = await generateJson(to, ivxId, tokenId);

            console.log('COMPLETED: ' + completed);

            if (!completed) {
                let responseBody = {
                    message: 'Was unable to upload json',
                };
                response = {
                    statusCode: 500,
                    body: JSON.stringify(responseBody),
                };
            }
        } else {
            let responseBody = {
                message: 'Already generated metadata',
            };
            response = {
                statusCode: 200,
                body: JSON.stringify(responseBody),
            };
        }
    } catch {
        let responseBody = {
            message: 'Could not fetch data',
        };

        response = {
            statusCode: 500,
            body: JSON.stringify(responseBody),
        };
    }

    console.log(response);

    return response;
};

const generateJson = async (address: string, id: string, tokenId: string) => {
    let metadata = {};

    console.log('here');

    metadata['name'] = 'IVX #' + tokenId;
    metadata['description'] = 'PROOF OF MEMBERSHIP TO IVX COLLECTIVE / PROOF OF OWNERSHIP FOR PHYSICAL GOOD';
    metadata['image'] = 'http://media.iv-x.xyz/' + tokenId + '.png';
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
    } catch (error) {
        console.log('error');
        return false;
    }
};

export const generateImage: Handler = async (event: any) => {
    console.log('GENERATING NOW');
};
