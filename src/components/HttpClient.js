const commonUtil = require('../common/CommonUtil');
const fs = require("fs");
const path = require("path");
const config = require("config");

const gdAuthClient = require('gd-auth-client');
const tokenInfo = {};

const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const axiosInstance = axios.create({
    baseURL: '/'
});

//Setup Axis Http Client Retry Policy
axiosRetry(axios, {
    retries: 10, // number of retries
    retryDelay: (retryCount) => {
        return retryCount * 10; // time interval between retries
    },
    retryCondition: async (error) => {
        // if retry condition is not specified, by default idempotent requests are retried
        return error.response.status === 401 || error.response.status >= 500;
    },
});

class HttpClient {
    constructor() {
        return (async () => {
            await this.#createAuthInterceptor();
            return this;
        })();
    }

    async post(url, body) {
        const {data} = await axiosInstance.post(url, JSON.stringify(body), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return data;
    }

    async #auth() {
        const response = await gdAuthClient.getTokenFromCertificate(config.JWT_HOST, tokenInfo.jwtCert, tokenInfo.jwtCertKey);
        tokenInfo.accessToken = response;
        tokenInfo.expirationTime = commonUtil.getCurrentTimeInMiliseconds() + (24 * 60 * 60 * 1000);
    }

    async #createAuthInterceptor() {
        tokenInfo.jwtCert = fs.readFileSync(path.resolve(__dirname, config.TLS_CERT_PATH));
        tokenInfo.jwtCertKey = fs.readFileSync(path.resolve(__dirname, config.TLS_CERT_KEY_PATH));

        await this.#auth();

        axiosInstance.interceptors.request.use(async (config) => {
            const accessTokenValid = commonUtil.getCurrentTimeInMiliseconds() <= (tokenInfo.expirationTime ?? commonUtil.getCurrentTimeInMiliseconds());
            if (!accessTokenValid) {
                await this.auth();
            }
            config.headers.Authorization = `sso-jwt ${tokenInfo.accessToken}`;
            return config;
        });

        axiosInstance.interceptors.response.use(async (response) => {
                return response;
            },
            (error) => {
                return axios(error.config);
            });
    }
}

module.exports = HttpClient;
