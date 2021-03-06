/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/plugin.js TAP plugin() - Import map defined through constructor "maps" argument take precedence over import map defined in eik.json > Should rewrite import statement to https://cdn.eik.dev/lit-element/v2 1`] = `
import { html } from 'lit-html/lit-html';
import { css } from 'lit-html';
import { LitElement } from 'https://cdn.eik.dev/lit-element/v2';

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

exports[`test/plugin.js TAP plugin() - Import map defined through constructor "maps" argument take precedence over import map defined through constructor "urls" argument > Should rewrite import statement to https://cdn.eik.dev/lit-element/v2 1`] = `
import { html } from 'lit-html/lit-html';
import { css } from 'lit-html';
import { LitElement } from 'https://cdn.eik.dev/lit-element/v2';

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

exports[`test/plugin.js TAP plugin() - Import map defined through constructor "urls" argument take precedence over import map defined in eik.json > Should rewrite import statement to https://cdn.eik.dev/lit-element/v2 1`] = `
import { html } from 'lit-html/lit-html';
import { css } from 'lit-html';
import { LitElement } from 'https://cdn.eik.dev/lit-element/v2';

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

exports[`test/plugin.js TAP plugin() - import map fetched from a URL > import maps from urls 1`] = `
import { html } from 'https://cdn.eik.dev/lit-html/v2';
import { css } from 'https://cdn.eik.dev/lit-html/v1';
import { LitElement } from 'https://cdn.eik.dev/lit-element/v2';

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

exports[`test/plugin.js TAP plugin() - import map fetched from a URL via eik.json > eik.json import-map string 1`] = `
import { html } from 'https://cdn.eik.dev/lit-html/v2';
import { css } from 'https://cdn.eik.dev/lit-html/v1';
import { LitElement } from 'https://cdn.eik.dev/lit-element/v2';

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
