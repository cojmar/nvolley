{
    "appDir": "../src",
    "mainConfigFile": "../src/app.js",
    "dir": "../docs",
    optimize: "none", // disable standard uglifyjs optimisations
    onBuildWrite:function(moduleName, path, contents) {     
        let terser = require.nodeRequire("terser");
        let options = {
            toplevel: true,
            compress: {                
                passes: 3
            },            
            mangle: true,
            output: {
                comments:false,
                beautify: false,
                preamble: ""
            }
        };

        let result = terser.minify(contents,options);
        if (result.error) {
            throw new Error(result.error);
        }
        return result.code;
    },
    "preserveLicenseComments": false,
    // List the modules that will be optimized.
    "modules": [
        {
            // module names are relative to baseUrl
            "name": "app"
        }
    ]
}
