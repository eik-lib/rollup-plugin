/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/tests/maps-fetched-via-package-json.js TAP plugin() - package.json defined import maps > import-map defined in package.json 1`] = `
import { html } from 'https://cdn.pika.dev/lit-html/v2';
import { css } from 'https://cdn.pika.dev/lit-html/v1';
import { LitElement } from 'https://cdn.pika.dev/lit-element/v2';

class Inner extends LitElement {
    static get styles() {
        return [css\`:host { color: red; }\`];
    }

    render(world) {
        return html\`<p>Hello \${world}!</p>\`;
    }
}

export default Inner;

`
