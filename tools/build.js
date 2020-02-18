{
    "appDir": "../src",
    "mainConfigFile": "../src/app.js",
    "dir": "../docs",
    optimize: "none", // disable standard uglifyjs optimisations
    onBuildWrite:function(moduleName, path, contents) {     
        let terser = require.nodeRequire("terser");
        let options = {      
            parse: {
                ecma: 5, // specify one of: 5, 2015, 2016, 2017 or 2018
            },      
            compress: {                
                passes: 3
            },            
            mangle: true,            
            output: {                
                comments:false,
                beautify: false,
                preamble: ""
            },
            ecma: 5, // specify one of: 5, 2015, 2016, 2017 or 2018
            keep_classnames: false,
            keep_fnames: false,
            ie8: false,
            module: false,
            nameCache: null, // or specify a name cache object
            safari10: false,
            toplevel: false,
            warnings: false,
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
