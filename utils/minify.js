const { rollup } = require("rollup");
const { uglify } = require('rollup-plugin-uglify');
const { writeFileSync } = require('fs');

(async () => {
    const bundle = await rollup({
        input: __dirname + "/../src/rss.js",
        plugins: [uglify()]
    });

    const { output } = await bundle.generate({ format: 'iife' });

    writeFileSync(__dirname + '/../dist/rss.min.js', output[0].code);
    console.log(__dirname + '/../dist/rss.min.js was updated!');
})();