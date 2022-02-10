import { Handler } from 'aws-lambda';

export const tokenId: Handler = (event: any) => {
    const id = event.pathParameters.tokenId;

    if (id.length == 0) {
        const response = {
            statusCode: 301,
            headers: {
                Location: 'https://token.iv-x.xyz/',
            },
        };

        return new Promise((resolve) => {
            resolve(response);
        });
    }

    const response = {
        statusCode: 301,
        headers: {
            Location: 'https://token.iv-x.xyz/' + id,
        },
    };

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
