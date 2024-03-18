import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
export default ({
    input: 'lib/browser.js',
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                "'./binaryajax.js'": "''./binaryajax-browser.js"
            }
        }),


        nodeResolve({ browser: true }),
        commonjs(),
        nodePolyfills(),
    ],
    output: {
        file: './dist/shp.js',
        format: 'umd',
        name: 'shp'
    }
})