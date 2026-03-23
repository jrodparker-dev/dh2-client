const assert = require('assert').strict;
const fs = require('fs');
const vm = require('vm');

window = global;

require('../play.pokemonshowdown.com/js/battle-dex-data.js');
require('../play.pokemonshowdown.com/js/battle-dex.js');
Dex.getTypeIcon = type => `[${type}]`;
const originalGetItem = Dex.items.get.bind(Dex.items);
Dex.items.get = item => {
	const result = originalGetItem(item);
	if (result.name === 'Choice Scarf') result.exists = true;
	return result;
};
require('../play.pokemonshowdown.com/js/battle-scene-stub.js');
global.BattleLog = {escapeHTML: str => str};
require('../play.pokemonshowdown.com/js/battle-text-parser.js');
require('../play.pokemonshowdown.com/js/battle.js');
vm.runInThisContext(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-tooltips.js'), 'utf8'));

describe('Battle tooltip regressions', () => {
	function createBattle(log) {
		return new Battle({debug: true, log});
	}

	it('shows a revealed foe item in limited battle tooltips', () => {
		const battle = createBattle([
			'|init|battle',
			'|player|p1|FOO|169',
			'|player|p2|BAR|265',
			'|teamsize|p1|6',
			'|teamsize|p2|6',
			'|gametype|singles',
			'|gen|9',
			'|tier|[Gen 9] Random Battle',
			'|start',
			'|switch|p1a: Leafeon|Leafeon, L83, F|100/100',
			'|switch|p2a: Gliscor|Gliscor, L77, F|242/242',
		]);
		const foe = battle.farSide.active[0];
		foe.item = 'Choice Scarf';
		foe.itemEffect = 'frisked';

		const tooltips = new BattleTooltips(battle);
		const html = tooltips.showPokemonTooltip(foe, null, true);

		assert.match(html, /<small>Item:<\/small> Choice Scarf \(frisked\)/);
	});

	it('matches the active foe tooltip to the correct server-side Pokemon entry', () => {
		const battle = createBattle([
			'|init|battle',
			'|player|p1|FOO|169',
			'|player|p2|BAR|265',
			'|teamsize|p1|6',
			'|teamsize|p2|6',
			'|gametype|singles',
			'|gen|9',
			'|tier|[Gen 9] Random Battle',
			'|start',
			'|switch|p1a: Leafeon|Leafeon, L83, F|100/100',
			'|switch|p2a: Gliscor|Gliscor, L77, F|242/242',
			'|switch|p2a: Kyurem|Kyurem-White, L73|303/303',
		]);
		const activeFoe = battle.farSide.active[0];
		battle.foePokemon = [
			{ident: 'p2: Gliscor', details: 'Gliscor, L77, F', speciesForme: 'Gliscor'},
			{ident: activeFoe.ident, details: activeFoe.details, speciesForme: 'Kyurem-White'},
		];

		const tooltips = new BattleTooltips(battle);
		let matchedServerPokemon = null;
		tooltips.showPokemonTooltip = (clientPokemon, serverPokemon) => {
			matchedServerPokemon = serverPokemon;
			return '';
		};
		tooltips.placeTooltip = () => true;

		tooltips.showTooltip({dataset: {tooltip: 'activepokemon|1|0'}});

		assert.deepEqual(matchedServerPokemon, battle.foePokemon[1]);
	});
});
