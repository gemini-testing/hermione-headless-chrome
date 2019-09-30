'use strict';

const proxyquire = require('proxyquire');
const {stubTool} = require('./utils');

describe('index', () => {
    let plugin;
    const parseConfig = sinon.stub();
    const downloadChromium = sinon.stub();

    const mkHermione_ = (config = {}, events) => stubTool(config, events);

    const initPlugin = (hermione, opts) => {
        parseConfig.returns(opts);
        return plugin(hermione, opts);
    };

    beforeEach(() => {
        plugin = proxyquire('index', {
            './lib/parse-config': parseConfig,
            './lib/download-chromium-by-version': downloadChromium
        });
    });

    it('should does nothing if plugin is disabled', () => {
        initPlugin(mkHermione_(), {enabled: false});

        assert.notCalled(downloadChromium);
    });

    it('should throws if headless browser was not specified', () => {
        const hermione = mkHermione_({browsers: {'foo-bar': {}}});
        const opts = {enabled: true, browserId: 'bar-foo'};

        assert.isRejected(initPlugin(hermione, opts));
    });

    it('should sets desired capabilities for passed browser', async () => {
        const browser = {desiredCapabilities: {}};
        const hermione = mkHermione_({browsers: {'foo-bar': browser}});
        const expectedBrowser = {
            desiredCapabilities: {
                chromeOptions: {
                    args: ['headless'],
                    binary: 'path/to/bin'
                }
            }
        };
        downloadChromium.resolves('path/to/bin');

        initPlugin(hermione, {enabled: true, browserId: 'foo-bar'});
        await hermione.emitAndWait(hermione.events.INIT);

        assert.deepEqual(browser, expectedBrowser);
    });

    it('should union Chrome options for passed browser', async () => {
        const browser = {desiredCapabilities: {
            chromeOptions: {
                args: ['some-arg']
            }
        }};
        const hermione = mkHermione_({browsers: {'foo-bar': browser}});
        const expectedBrowser = {
            desiredCapabilities: {
                chromeOptions: {
                    args: ['some-arg', 'headless'],
                    binary: 'path/to/bin'
                }
            }
        };
        downloadChromium.resolves('path/to/bin');

        initPlugin(hermione, {enabled: true, browserId: 'foo-bar'});
        await hermione.emitAndWait(hermione.events.INIT);

        assert.deepEqual(browser, expectedBrowser);
    });
});
