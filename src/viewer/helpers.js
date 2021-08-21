"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRanking = exports.rankingHeader = exports.isMajorRound = exports.getOriginAbbreviation = exports.completeWithBlankMatches = exports.findRoot = exports.splitBy = void 0;
const lang_1 = require("./lang");
/**
 * Splits an array based on values of a given key of the objects of the array.
 *
 * @param array The array to split.
 * @param key The key of T.
 */
function splitBy(array, key) {
    const obj = Object();
    for (const value of array) {
        if (!obj[value[key]])
            obj[value[key]] = [];
        obj[value[key]].push(value);
    }
    return Object.values(obj);
}
exports.splitBy = splitBy;
/**
 * Finds the root element
 *
 * @param selector An optional selector to select the root element.
 */
function findRoot(selector) {
    const queryResult = document.querySelectorAll(selector || '.brackets-viewer');
    if (queryResult.length === 0)
        throw Error('Root not found. You must have at least one root element.');
    if (queryResult.length > 1)
        throw Error('Multiple possible roots were found. Please use `config.selector` to choose a specific root.');
    const root = queryResult[0];
    if (!root.classList.contains('brackets-viewer'))
        throw Error('The selected root must have a `.brackets-viewer` class.');
    return root;
}
exports.findRoot = findRoot;
/**
 * Completes a list of matches with blank matches based on the next matches.
 *
 * Toornament can generate first rounds with an odd number of matches and the seeding is partially distributed in the second round.
 * This function adds a blank match in the first round as if it was the source match of a seeded match of the second round.
 *
 * @param matches The list of first round matches.
 * @param nextMatches The list of second round matches.
 * @param bracketType Type of the bracket.
 */
function completeWithBlankMatches(matches, nextMatches, bracketType) {
    let sources = [];
    if (bracketType === 'single-bracket' || bracketType === 'winner-bracket')
        sources = nextMatches.map(match => { var _a, _b; return [((_a = match.opponent1) === null || _a === void 0 ? void 0 : _a.position) || null, ((_b = match.opponent2) === null || _b === void 0 ? void 0 : _b.position) || null]; }).flat();
    if (bracketType === 'loser-bracket')
        sources = nextMatches.map(match => { var _a; return ((_a = match.opponent2) === null || _a === void 0 ? void 0 : _a.position) || null; });
    // The manager does not set positions where the Toornament layer does.
    if (sources.filter(source => source !== null).length === 0)
        return { matches, fromToornament: false };
    return {
        matches: sources.map(source => source && matches.find(match => match.number === source) || null),
        fromToornament: true,
    };
}
exports.completeWithBlankMatches = completeWithBlankMatches;
/**
 * Returns the abbreviation for a participant origin.
 *
 * @param matchLocation Location of the match.
 * @param skipFirstRound Whether to skip the first round.
 * @param roundNumber Number of the round.
 * @param side Side of the participant.
 */
function getOriginAbbreviation(matchLocation, skipFirstRound, roundNumber, side) {
    roundNumber = roundNumber || -1;
    if (skipFirstRound && matchLocation === 'loser-bracket' && roundNumber === 1)
        return lang_1.abbreviations.seed;
    if (matchLocation === 'single-bracket' || matchLocation === 'winner-bracket' && roundNumber === 1)
        return lang_1.abbreviations.seed;
    if (matchLocation === 'loser-bracket' && roundNumber % 2 === 0 && side === 'opponent1')
        return lang_1.abbreviations.position;
    return null;
}
exports.getOriginAbbreviation = getOriginAbbreviation;
/**
 * Indicates whether a round is major.
 *
 * @param roundNumber Number of the round.
 */
function isMajorRound(roundNumber) {
    return roundNumber === 1 || roundNumber % 2 === 0;
}
exports.isMajorRound = isMajorRound;
/**
 * Returns the header for a ranking property.
 *
 * @param itemName Name of the ranking property.
 */
function rankingHeader(itemName) {
    return lang_1.headers[itemName];
}
exports.rankingHeader = rankingHeader;
/**
 * Calculates the ranking based on a list of matches and a formula.
 *
 * @param matches The list of matches.
 * @param formula The points formula to apply.
 */
function getRanking(matches, formula) {
    formula = formula || ((item) => 3 * item.wins + 1 * item.draws + 0 * item.losses);
    const rankingMap = {};
    for (const match of matches) {
        processParticipant(rankingMap, formula, match.opponent1, match.opponent2);
        processParticipant(rankingMap, formula, match.opponent2, match.opponent1);
    }
    return createRanking(rankingMap);
}
exports.getRanking = getRanking;
/**
 * Processes a participant and edits the ranking map.
 *
 * @param rankingMap The ranking map to edit.
 * @param formula The points formula to apply.
 * @param current The current participant.
 * @param other The opponent.
 */
function processParticipant(rankingMap, formula, current, other) {
    if (!current || current.id === null)
        return;
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
function createRanking(rankingMap) {
    const ranking = Object.values(rankingMap).sort((a, b) => a.points !== b.points ? b.points - a.points : b.played - a.played);
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
