"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.headers = exports.BYE = exports.bestOfX = exports.abbreviations = exports.getLoserBracketRoundName = exports.getWinnerBracketRoundName = exports.getRoundName = exports.getGroupName = exports.getMatchStatus = exports.getFinalMatchLabel = exports.getMatchLabel = exports.getFinalOriginHint = exports.getOriginHint = exports.i18next = void 0;
const i18next_1 = __importDefault(require("i18next"));
exports.i18next = i18next_1.default;
const i18next_browser_languagedetector_1 = __importDefault(require("i18next-browser-languagedetector"));
const i18n_1 = require("../i18n");
const brackets_model_1 = require("brackets-model");
const helpers_1 = require("./helpers");
i18next_1.default.use(i18next_browser_languagedetector_1.default).init({
    fallbackLng: 'en',
    debug: true,
    resources: {},
});
// Load locale bundles.
Object.keys(i18n_1.locales).forEach((lang) => i18next_1.default.addResourceBundle(lang, 'translation', i18n_1.locales[lang]));
/**
 * Returns an internationalized version of a locale key.
 *
 * @param scope A locale scope.
 * @param key A locale key.
 * @param options Data to pass to the i18n process or a boolean.
 */
function i18n(scope, key, options) {
    if (typeof options === 'boolean')
        return i18next_1.default.t(`${scope}.${key}`, { returnObjects: true });
    return i18next_1.default.t(`${scope}.${key}`, options);
}
/**
 * Returns an origin hint function based on rounds information.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param skipFirstRound Whether to skip the first round.
 * @param matchLocation Location of the match.
 */
function getOriginHint(roundNumber, roundCount, skipFirstRound, matchLocation) {
    if (roundNumber === 1) {
        if (matchLocation === 'single-bracket')
            return (position) => i18n('origin-hint', 'seed', { position });
        if (matchLocation === 'winner-bracket')
            return (position) => i18n('origin-hint', 'seed', { position });
        if (matchLocation === 'loser-bracket' && skipFirstRound)
            return (position) => i18n('origin-hint', 'seed', { position });
    }
    if (helpers_1.isMajorRound(roundNumber) && matchLocation === 'loser-bracket') {
        if (roundNumber === roundCount - 2)
            return (position) => i18n('origin-hint', 'winner-bracket-semi-final', { position });
        if (roundNumber === roundCount)
            return () => i18n('origin-hint', 'winner-bracket-final');
        const roundNumberWB = Math.ceil((roundNumber + 1) / 2);
        if (skipFirstRound)
            return (position) => i18n('origin-hint', 'winner-bracket', { round: roundNumberWB - 1, position });
        return (position) => i18n('origin-hint', 'winner-bracket', { round: roundNumberWB, position });
    }
    return undefined;
}
exports.getOriginHint = getOriginHint;
/**
 * Returns an origin hint function for a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 */
function getFinalOriginHint(finalType, roundNumber) {
    // Single elimination.
    if (finalType === 'consolation_final')
        return (position) => i18n('origin-hint', 'consolation-final', { position });
    // Double elimination.
    if (roundNumber === 1) // Grand Final round 1
        return () => i18n('origin-hint', 'grand-final');
    // Grand Final round 2 (no hint because it's obvious both participants come from the previous round)
    return undefined;
}
exports.getFinalOriginHint = getFinalOriginHint;
/**
 * Returns the label of a match.
 *
 * @param matchNumber Number of the match.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param matchLocation Location of the match.
 */
function getMatchLabel(matchNumber, roundNumber, roundCount, matchLocation) {
    const matchPrefix = matchLocation === 'winner-bracket' ? i18n('match-label', 'winner-bracket') :
        matchLocation === 'loser-bracket' ? i18n('match-label', 'loser-bracket') : i18n('match-label', 'standard-bracket');
    const inSemiFinalRound = roundNumber === roundCount - 1;
    const inFinalRound = roundNumber === roundCount;
    if (matchLocation === 'single-bracket') {
        if (inSemiFinalRound)
            return i18n('match-label', 'standard-bracket-semi-final', { matchNumber });
        if (inFinalRound)
            return i18n('match-label', 'standard-bracket-final');
    }
    if (inSemiFinalRound)
        return i18n('match-label', 'double-elimination-semi-final', { matchPrefix, matchNumber });
    if (inFinalRound)
        return i18n('match-label', 'double-elimination-final', { matchPrefix });
    return i18n('match-label', 'double-elimination', { matchPrefix, roundNumber, matchNumber });
}
exports.getMatchLabel = getMatchLabel;
/**
 * Returns the label of a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
function getFinalMatchLabel(finalType, roundNumber, roundCount) {
    // Single elimination.
    if (finalType === 'consolation_final')
        return i18n('match-label', 'consolation-final');
    // Double elimination.
    if (roundCount === 1)
        return i18n('match-label', 'grand-final-single');
    return i18n('match-label', 'grand-final', { roundNumber });
}
exports.getFinalMatchLabel = getFinalMatchLabel;
/**
 * Returns the status of a match.
 *
 * @param status The match status.
 */
function getMatchStatus(status) {
    switch (status) {
        case brackets_model_1.Status.Locked:
            return i18n('match-status', 'locked');
        case brackets_model_1.Status.Waiting:
            return i18n('match-status', 'waiting');
        case brackets_model_1.Status.Ready:
            return i18n('match-status', 'ready');
        case brackets_model_1.Status.Running:
            return i18n('match-status', 'running');
        case brackets_model_1.Status.Completed:
            return i18n('match-status', 'completed');
        case brackets_model_1.Status.Archived:
            return i18n('match-status', 'archived');
        default:
            return 'Unknown status';
    }
}
exports.getMatchStatus = getMatchStatus;
/**
 * Returns the name of a group.
 *
 * @param groupNumber Number of the group.
 */
function getGroupName(groupNumber) {
    return i18n('common', 'group-name', { groupNumber });
}
exports.getGroupName = getGroupName;
/**
 * Returns the name of a round.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
function getRoundName(roundNumber, roundCount) {
    return roundNumber === roundCount ? i18n('common', 'round-name-final') : i18n('common', 'round-name', { roundNumber });
}
exports.getRoundName = getRoundName;
/**
 * Returns the name of a round in the winner bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
function getWinnerBracketRoundName(roundNumber, roundCount) {
    return roundNumber === roundCount ? i18n('common', 'round-name-winner-bracket-final') : i18n('common', 'round-name-winner-bracket', { roundNumber });
}
exports.getWinnerBracketRoundName = getWinnerBracketRoundName;
/**
 * Returns the name of a round in the loser bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
function getLoserBracketRoundName(roundNumber, roundCount) {
    return roundNumber === roundCount ? i18n('common', 'round-name-loser-bracket-final') : i18n('common', 'round-name-loser-bracket', { roundNumber });
}
exports.getLoserBracketRoundName = getLoserBracketRoundName;
/**
 * Abbreviations used in the viewer.
 */
exports.abbreviations = {
    win: i18n('abbreviations', 'win'),
    loss: i18n('abbreviations', 'loss'),
    forfeit: i18n('abbreviations', 'forfeit'),
    position: i18n('abbreviations', 'position'),
    seed: i18n('abbreviations', 'seed'),
};
/**
 * The Best of X literal.
 *
 * @param x Child count.
 */
const bestOfX = (x) => i18n('common', 'best-of-x', { x });
exports.bestOfX = bestOfX;
/**
 * The BYE literal.
 */
exports.BYE = i18n('common', 'bye');
/**
 * Headers of the ranking.
 */
exports.headers = {
    rank: i18n('ranking', 'rank', true),
    id: i18n('ranking', 'id', true),
    played: i18n('ranking', 'played', true),
    wins: i18n('ranking', 'wins', true),
    draws: i18n('ranking', 'draws', true),
    losses: i18n('ranking', 'losses', true),
    forfeits: i18n('ranking', 'forfeits', true),
    scoreFor: i18n('ranking', 'score-for', true),
    scoreAgainst: i18n('ranking', 'score-against', true),
    scoreDifference: i18n('ranking', 'score-difference', true),
    points: i18n('ranking', 'points', true),
};
