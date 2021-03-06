const path = require("path");
const fs = require("fs");
const bufferEquals = require("buffer-equals");
const nodeFetch = require("node-fetch");
const setFetchMethod = require("../../dist/request.js").setFetchMethod;

const SOURCE_BIN = path.resolve(__dirname, "../testContents/alrighty.jpg");
const SOURCE_TXT = path.resolve(__dirname, "../testContents/text document.txt");

describe("getFileContents", function() {
    beforeEach(function() {
        setFetchMethod(); // use default
        this.client = createWebDAVClient(
            "http://localhost:9988/webdav/server",
            createWebDAVServer.test.username,
            createWebDAVServer.test.password
        );
        clean();
        this.server = createWebDAVServer();
        return this.server.start();
    });

    afterEach(function() {
        return this.server.stop();
    });

    it("reads a remote file into a buffer", function() {
        return this.client.getFileContents("/alrighty.jpg").then(function(bufferRemote) {
            const bufferLocal = fs.readFileSync(SOURCE_BIN);
            expect(bufferEquals(bufferRemote, bufferLocal)).to.be.true;
        });
    });

    it("uses .buffer() when available", function() {
        return this.client.getFileContents("/alrighty.jpg").then(res => {
            expect(res).to.be.an.instanceof(Buffer);
        });
    });

    it("uses .arrayBuffer() when .buffer() is not available", function() {
        setFetchMethod(function fakeFetch() {
            return nodeFetch.apply(null, arguments).then(function(response) {
                return {
                    arrayBuffer: response.arrayBuffer.bind(response)
                };
            });
        }); // use fixed
        return this.client.getFileContents("/alrighty.jpg").then(res => {
            expect(res).to.be.an.instanceof(ArrayBuffer);
        });
    });

    it("reads a remote file into a string", function() {
        return this.client.getFileContents("/text document.txt", { format: "text" }).then(function(stringRemote) {
            const stringLocal = fs.readFileSync(SOURCE_TXT, "utf8");
            expect(stringRemote).to.equal(stringLocal);
        });
    });
});
