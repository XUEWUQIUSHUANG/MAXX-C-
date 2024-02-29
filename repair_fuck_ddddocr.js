const fs = require('fs');

function repair_fuck_ddddocr() {
    fs.readFile("./node_modules/ddddocr/dist/index.js", 'utf8', (err, core) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        core = core.replace("exports.default = DdddOcr;", "module.exports = DdddOcr;");
        fs.writeFile("./node_modules/ddddocr/dist/index.js", core, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return;
            }
        });
    });
}

repair_fuck_ddddocr();
