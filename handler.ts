import { Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { GetItemInput } from 'aws-sdk/clients/dynamodb';

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'ivx-status';

async function getItem(params: GetItemInput) {
    try {
        const data = await docClient.get(params).promise();
        return data;
    } catch (err) {
        return err;
    }
}

export const tokenId: Handler = async (event: any) => {
    const id = event.pathParameters.tokenId;
    let response: {};

    if (id.length == 0) {
        response = {
            statusCode: 301,
            headers: {
                Location: 'https://token.iv-x.xyz/',
            },
        };
    } else {
        const params = {
            TableName: tableName,
            Key: {
                tokenId: id,
            },
        };

        try {
            const data = await getItem(params);

            if (Object.keys(data).length == 0) {
                response = {
                    statusCode: 301,
                    headers: {
                        Location: 'https://token.iv-x.xyz/' + id,
                    },
                };
            } else {
                response = {
                    statusCode: 200,
                    body: JSON.stringify(data),
                };
            }
        } catch (err) {
            response = {
                statusCode: 301,
                headers: {
                    Location: 'https://token.iv-x.xyz/' + id,
                },
            };
        }
    }

    return new Promise((resolve) => {
        resolve(response);
    });
};

export const token: Handler = (event: any) => {
    const response = {
        statusCode: 301,
        headers: {
            Location: 'https://token.iv-x.xyz/',
        },
    };

    return new Promise((resolve) => {
        resolve(response);
    });
};
