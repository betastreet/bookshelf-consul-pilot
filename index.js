const ConsulPilot = require('consul-pilot');
const fs = require('fs');
const path = require('path');

class BookshelfConsulPilot {

    constructor(knexConfig, watchService, modelsDir, plugins) {
        this._knexConfig = knexConfig;
        this._modelsDir = modelsDir || path.join(__dirname, '/../models');
        this._plugins = plugins;
        this._registers = [];

        const knex = require('knex')(this._knexConfig);

        this._connectBookshelf(knex);

        this._watcher(watchService);
    }

    _connectBookshelf(knex) {
        this._bookshelf = require('bookshelf')(knex);

        if (this._plugins) this._plugins(this._bookshelf);

        this._refreshModels();

        this._fireRegisters();
    }

    _reconnect(service) {
        const self = this;

        this._knexConfig.connection.host = service.address;

        this._bookshelf.knex.destroy().then(() => {
            const knex = require('knex')(self._knexConfig);
            self._connectBookshelf(knex);
        });
    }

    _refreshModels() {
        const self = this;

        if (!self._models) self._models = {};

        fs.readdirSync(this._modelsDir)
            .filter((file) => {
                return (file.indexOf('.') !== 0);
            })
            .forEach((file) => {
                if (file.slice(-3) !== '.js') return;
                const model = require(path.join(this._modelsDir, file))(this._bookshelf);
                self._models[file.substring(0, file.length - 3)] = model;
            });
    }

    _fireRegisters() {
        const self = this;

        this._registers.forEach((func) => {
            func(self._bookshelf);
        });
    }

    _watcher(watchService) {
        const self = this;

        ConsulPilot.watch(watchService, (err, service) => {
            if (err) console.error(err);

            console.log('New database connection reported', service);

            if (service.address) self._reconnect(service);
        });
    }

    model(model) {
        return this._models[model];
    }

    register(func) {
        this._registers.push(func);
    }

    get knex() {
        return this._bookshelf._knex;
    }

    get bookshelf() {
        return this._bookshelf;
    }

}

module.exports = BookshelfConsulPilot;
