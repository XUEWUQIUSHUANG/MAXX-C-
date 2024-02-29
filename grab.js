const fs = require('fs');
const axios = require('axios');
const https = require('https');
const CryptoJS = require('crypto-js');
const Ddddocr = require('ddddocr');

let config = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

function Encrypt(word) {
    const srcs = CryptoJS.enc.Utf8.parse(word);
    const key = CryptoJS.enc.Utf8.parse(config.AES.key);
    let encrypted = CryptoJS.AES.encrypt(srcs, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

function grab() {
    axios
        .post(config.url.captcha, {}, {
            httpsAgent: agent
        }).then(res => {
            return {
                loginname: config.login.username,
                password: Encrypt(config.login.password),
                captcha: res.data.data.captcha,
                uuid: res.data.data.uuid,
            }
        }).then(async loginData => {
            const base64String = loginData.captcha;
            const imagePath = config.image;
            const dataStartIndex = base64String.indexOf(',') + 1;
            const fileData = Buffer.from(base64String.slice(dataStartIndex), 'base64');
            fs.writeFileSync(imagePath, fileData);

            await Ddddocr.create().then(async ddddocr => {
                const verifyCode = await ddddocr.classification(imagePath);
                loginData.captcha = verifyCode
            })
            fs.unlinkSync(config.image)
            return loginData;
        }).then(async loginData => {
            let token;
            await axios
                .post(config.url.login, loginData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    httpsAgent: agent
                }).then(res => {
                    token = res.data.data.token
                })
            return token
        }).then(token => {
            const XGXKLB = { A: 12, B: 13, C: 14, D: 15, E: 16, F: 17, A0: 18 };
            const list_data = JSON.stringify({
                SFCT: "0",
                XGXKLB: XGXKLB[config.class.type],
                KEY: config.class.key,
                campus: "01",
                orderBy: "",
                pageNumber: 1,
                pageSize: 1000,
                teachingClassType: "XGKC"
            })
            let i = -1;
            axios.post(config.url.list, list_data, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Authorization': token
                },
                httpsAgent: agent
            }).then((response) => {
                console.log(response.data.msg, "可选" + response.data.data.total + "节");
                response.data.data.rows.forEach((KCM) => {
                    console.log(KCM.KCM)
                })
                setInterval(() => {
                    response.data.data.rows.forEach(org => {
                        i++;
                        setTimeout(() => {
                            axios.post(config.url.add, {
                                clazzType: 'XGKC',
                                clazzId: org.JXBID,
                                secretVal: org.secretVal,
                                chooseVolunteer: 1
                            }, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                    'Authorization': token
                                },
                                httpsAgent: agent
                            }).then((response) => {
                                console.log(response.data)
                                if (response.data.msg == '已选满5门,不可再选') {
                                    process.exit()
                                }
                            })
                        }, i % response.data.data.rows.length * config.speed);
                    })
                }, response.data.data.rows.length * config.speed)
            })
        })
}

grab();




