import { Match, ParticipantResult, GroupType, MatchGame } from 'brackets-model';
import { RankingHeader, Ranking, RankingFormula, RankingItem, RankingMap, Side, MatchWithMetadata } from './types';
import { t } from './lang';

/**
 * Splits an array of objects based on their values at a given key.
 *
 * @param objects The array to split.
 * @param key The key of T.
 */
export function splitBy<
    T extends Record<string, unknown>,
    K extends keyof T,
    U extends Record<K, string | number>
>(objects: U[], key: K): U[][] {
    const map = {} as Record<string | number, U[]>;

    for (const obj of objects) {
        const commonValue = obj[key];

        if (!map[commonValue])
            map[commonValue] = [];

        map[commonValue].push(obj);
    }

    return Object.values(map);
}

/**
 * Splits an array of objects based on their values at a given key.
 * Objects without a value at the given key will be set under a `-1` index.
 *
 * @param objects The array to split.
 * @param key The key of T.
 */
export function splitByWithLeftovers<
    T extends Record<string, unknown>,
    K extends keyof T,
    U extends Record<K, string | number>
>(objects: U[], key: K): U[][] {
    const map = {} as Record<string | number, U[]>;

    for (const obj of objects) {
        const commonValue = obj[key] ?? '-1'; // Object keys are converted to a string.

        if (!map[commonValue])
            map[commonValue] = [];

        map[commonValue].push(obj);
    }

    const withoutLeftovers = Object.entries(map)
        .filter(([key]) => key !== '-1')
        .map(([_, value]) => value);

    const result = [...withoutLeftovers];
    result[-1] = map[-1];
    return result;
}

/**
 * Sorts the objects in the given array by a given key.
 *
 * @param array The array to sort.
 * @param key The key of T.
 */
export function sortBy<
    T extends Record<string, unknown>,
    K extends keyof T,
    U extends Record<K, number>
>(array: U[], key: K): U[] {
    return [...array].sort((a, b) => a[key] - b[key]);
}

/**
 * Finds the root element
 *
 * @param selector An optional selector to select the root element.
 */
export function findRoot(selector?: string): HTMLElement {
    const queryResult = document.querySelectorAll(selector || '.brackets-viewer');

    if (queryResult.length === 0)
        throw Error('Root not found. You must have at least one root element.');

    if (queryResult.length > 1)
        throw Error('Multiple possible roots were found. Please use `config.selector` to choose a specific root.');

    const root = queryResult[0] as HTMLElement;

    if (!root.classList.contains('brackets-viewer'))
        throw Error('The selected root must have a `.brackets-viewer` class.');

    return root;
}

/**
 * Completes a list of matches with blank matches based on the next matches.
 * 
 * Toornament can generate first rounds with an odd number of matches and the seeding is partially distributed in the second round.
 * This function adds a blank match in the first round as if it was the source match of a seeded match of the second round.
 * 
 * @param bracketType Type of the bracket.
 * @param matches The list of first round matches.
 * @param nextMatches The list of second round matches.
 */
export function completeWithBlankMatches(bracketType: GroupType, matches: MatchWithMetadata[], nextMatches?: MatchWithMetadata[]): {
    matches: (MatchWithMetadata | null)[],
    fromToornament: boolean,
} {
    if (!nextMatches)
        return { matches, fromToornament: false };

    let sources: (number | null)[] = [];

    if (bracketType === 'single_bracket' || bracketType === 'winner_bracket')
        sources = nextMatches.map(match => [match.opponent1?.position || null, match.opponent2?.position || null]).flat();

    if (bracketType === 'loser_bracket')
        sources = nextMatches.map(match => match.opponent2?.position || null);

    // The manager does not set positions where the Toornament layer does.
    if (sources.filter(source => source !== null).length === 0)
        return { matches, fromToornament: false };

    return {
        matches: sources.map(source => source && matches.find(match => match.number === source) || null),
        fromToornament: true,
    };
}

/**
 * Returns the abbreviation for a participant origin.
 *
 * @param matchLocation Location of the match.
 * @param skipFirstRound Whether to skip the first round.
 * @param roundNumber Number of the round.
 * @param side Side of the participant.
 */
export function getOriginAbbreviation(matchLocation: GroupType, skipFirstRound: boolean, roundNumber?: number, side?: Side): string | null {
    roundNumber = roundNumber || -1;

    if (skipFirstRound && matchLocation === 'loser_bracket' && roundNumber === 1)
        return t('abbreviations.seed');

    if (matchLocation === 'single_bracket' || matchLocation === 'winner_bracket' && roundNumber === 1)
        return t('abbreviations.seed');

    if (matchLocation === 'loser_bracket' && roundNumber % 2 === 0 && side === 'opponent1')
        return t('abbreviations.position');

    return null;
}

/**
 * Indicates whether a round is major.
 *
 * @param roundNumber Number of the round.
 */
export function isMajorRound(roundNumber: number): boolean {
    return roundNumber === 1 || roundNumber % 2 === 0;
}

/**
 * Returns the header for a ranking property.
 *
 * @param itemName Name of the ranking property.
 */
export function rankingHeader(itemName: keyof RankingItem): RankingHeader {
    return t(`ranking.${itemName}`, { returnObjects: true }) as RankingHeader;
}

/**
 * Calculates the ranking based on a list of matches and a formula.
 *
 * @param matches The list of matches.
 * @param formula The points formula to apply.
 */
export function getRanking(matches: Match[], formula?: RankingFormula): Ranking {
    formula = formula || (
        (item: RankingItem): number => 3 * item.wins + 1 * item.draws + 0 * item.losses
    );

    const rankingMap: RankingMap = {};

    for (const match of matches) {
        processParticipant(rankingMap, formula, match.opponent1, match.opponent2);
        processParticipant(rankingMap, formula, match.opponent2, match.opponent1);
    }

    return createRanking(rankingMap);
}

/**
 * Processes a participant and edits the ranking map.
 *
 * @param rankingMap The ranking map to edit.
 * @param formula The points formula to apply.
 * @param current The current participant.
 * @param other The opponent.
 */
function processParticipant(rankingMap: RankingMap, formula: RankingFormula, current: ParticipantResult | null, other: ParticipantResult | null): void {
    if (!current || current.id === null) return;

    const state = rankingMap[current.id] || {
        rank: 0,
        id: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        scoreDifference: 0,
        points: 0,
    };

    state.id = current.id;

    if (current.forfeit || current.result)
        state.played++;

    if (current.result === 'win')
        state.wins++;

    if (current.result === 'draw')
        state.draws++;

    if (current.result === 'loss')
        state.losses++;

    if (current.forfeit)
        state.forfeits++;

    state.scoreFor += current.score || 0;
    state.scoreAgainst += other && other.score || 0;
    state.scoreDifference = state.scoreFor - state.scoreAgainst;

    state.points = formula(state);

    rankingMap[current.id] = state;
}

/**
 * Creates the final ranking based on a ranking map. (Sort + Total points)
 *
 * @param rankingMap The ranking map (object).
 */
function createRanking(rankingMap: RankingMap): RankingItem[] {
    const ranking = Object.values(rankingMap).sort((a, b) => a.points !== b.points
        ? b.points - a.points
        : a.played !== b.played
            ? b.played - a.played
            : b.scoreDifference - a.scoreDifference);

    const rank = {
        value: 0,
        lastPoints: -1,
    };

    for (const item of ranking) {
        item.rank = rank.lastPoints !== item.points ? ++rank.value : rank.value;
        rank.lastPoints = item.points;
    }

    return ranking;
}

/**
 * Indicates whether the input is a match.
 * 
 * @param input A match or a match game.
 */
export function isMatch(input: Match | MatchGame): input is Match {
    return 'child_count' in input;
}


/**
 * Indicates whether the input is a match game.
 * 
 * @param input A match or a match game.
 */
export function isMatchGame(input: Match | MatchGame): input is MatchGame {
    return !isMatch(input);
}
