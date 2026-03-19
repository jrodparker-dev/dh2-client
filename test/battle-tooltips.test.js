const assert = require('assert').strict;
const fs = require('fs');

let BattleCtor;
let BattleTooltipsCtor;

function createBattleContext() {
	const battle = new BattleCtor();
	const tooltips = new BattleTooltipsCtor(battle);
	const foe = battle.p2.addPokemon('Sparky', 'p2: Sparky', 'Pikachu, L50, M');
	const serverPokemon = {
		active: true,
		condition: '100/100',
		details: 'Pikachu, L50, M',
		gender: 'M',
		gigantamax: false,
		hp: 100,
		hpcolor: 'g',
		ident: 'p2: Sparky',
		item: '',
		level: 50,
		maxhp: 100,
		moves: ['shadowball'],
		name: 'Sparky',
		pokeball: 'pokeball',
		searchid: 'p2: Sparky|Pikachu, L50, M',
		shiny: false,
		speciesForme: 'Pikachu',
		stats: {atk: 55, def: 40, spa: 50, spd: 50, spe: 90},
		baseAbility: '',
		teraType: 'Ghost',
		terastallized: '',
	};
	return {battle, foe, serverPokemon, tooltips};
}

describe('Battle tooltips', () => {
	before(() => {
		global.window = global;
		global.Config = {whitelist: [], routes: {psmain: 'play.pokemonshowdown.com'}};
		global.ModSprites = {};
		global.BattleTypeChart = {
			Electric: {},
			Fire: {},
			Ghost: {},
			Normal: {},
		};
		global.BattleMovedex = {
			shadowball: {name: 'Shadow Ball', pp: 15, type: 'Ghost', category: 'Special'},
		};
		global.BattleAbilities = {
			lightningrod: {name: 'Lightning Rod'},
			mummy: {name: 'Mummy'},
			static: {name: 'Static'},
		};
		global.BattlePokedex = {
			pikachu: {
				name: 'Pikachu',
				species: 'Pikachu',
				baseSpecies: 'Pikachu',
				types: ['Electric'],
				abilities: {0: 'Static', H: 'Lightning Rod'},
				baseStats: {hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90},
				weightkg: 6,
				num: 25,
			},
		};

		require('../play.pokemonshowdown.com/js/battle-dex-data.js');
		require('../play.pokemonshowdown.com/js/battle-dex.js');
		global.eval(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-log.js'), 'utf8') + '\nglobal.BattleLog = BattleLog;');
		require('../play.pokemonshowdown.com/js/battle-scene-stub.js');
		require('../play.pokemonshowdown.com/js/battle.js');
		global.eval(fs.readFileSync(require.resolve('../play.pokemonshowdown.com/js/battle-tooltips.js'), 'utf8') + '\nglobal.BattleTooltips = BattleTooltips;');
		BattleCtor = global.Battle;
		BattleTooltipsCtor = global.BattleTooltips;
	});

	after(() => {
		delete global.BattlePokedex;
		delete global.BattleAbilities;
		delete global.BattleMovedex;
		delete global.BattleTypeChart;
		delete global.ModSprites;
	});

	it('shows remaining PP for revealed foe moves', () => {
		const {foe, serverPokemon, tooltips} = createBattleContext();
		foe.moveTrack = [['Shadow Ball', 2]];

		const html = tooltips.showPokemonTooltip(foe, serverPokemon, true);

		assert(html.includes('Shadow Ball <small>(22/24)</small>'));
	});

	it('shows public ability and type changes, then reverts to possible abilities after switching out', () => {
		const {foe, serverPokemon, tooltips} = createBattleContext();
		foe.rememberAbility('Mummy', true);
		foe.addVolatile('typechange', 'Fire');

		const revealedHtml = tooltips.showPokemonTooltip(foe, serverPokemon, true);
		assert(revealedHtml.includes('<small>Ability:</small> Mummy'));
		assert(revealedHtml.includes('(Type changed)'));
		assert(revealedHtml.includes('/types/Fire.png'));

		foe.clearVolatile();
		const switchedOutHtml = tooltips.showPokemonTooltip(foe, serverPokemon, false);
		assert(switchedOutHtml.includes('Possible abilities:</small> Static, Lightning Rod'));
		assert(!switchedOutHtml.includes('<small>Ability:</small> Mummy'));
	});

	it('shows terastallization from server state in inactive-zone tooltips', () => {
		const {foe, serverPokemon, tooltips} = createBattleContext();
		serverPokemon.terastallized = 'Ghost';

		const html = tooltips.showPokemonTooltip(foe, serverPokemon, false);

		assert(html.includes('(Terastallized)'));
		assert(html.includes('/types/Ghost.png'));
	});
});
