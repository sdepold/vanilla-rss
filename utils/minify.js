const { rollup } = require("rollup");
const { terser } = require("rollup-plugin-terser");
const { writeFileSync } = require('fs');

(async () => {
    const bundle = await rollup({
        input: __dirname + "/../src/rss.js",
        plugins: [terser()]
    });
    const { output } = await bundle.generate({ format: 'iife', name: 'RSS' });

    writeFileSync(__dirname + '/../dist/rss.min.js', output[0].code);
    console.log(__dirname + '/../dist/rss.min.js was updated!');
})();