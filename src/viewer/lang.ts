import i18next, { StringMap, TOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { Status } from 'brackets-model';
import { isMajorRound } from './helpers';
import { FinalType, BracketType, OriginHint, RankingHeaders, RankingHeader } from './types';

import en from '../i18n/en/translation.json';
import fr from '../i18n/fr/translation.json';

export const locales = {
    en,
    fr,
};

export type Locale = typeof locales['en'];

i18next.use(LanguageDetector).init({
    fallbackLng: 'en',
    debug: false,
    resources: {
        en: {
            translation: locales.en,
        },
        fr: {
            translation: locales.fr,
        },
    },
},
    undefined);

export { i18next };

/**
 * Returns an internationalized version of a locale key.
 * 
 * @param scope A locale scope.
 * @param key A locale key.
 * @param interpolations Data to pass to the i18n process.
 */
export function i18n<Scope extends keyof Locale>(scope: Scope, key: keyof Locale[Scope], interpolations?: TOptions): string;

/**
 * Returns an internationalized version of a locale key in an object.
 * 
 * @param scope A locale scope.
 * @param key A locale key.
 * @param returnObject Must be true.
 */
export function i18n<Scope extends keyof Locale>(scope: Scope, key: keyof Locale[Scope], returnObject: true): StringMap;

/**
 * Returns an internationalized version of a locale key.
 * 
 * @param scope A locale scope.
 * @param key A locale key.
 * @param options Data to pass to the i18n process or a boolean.
 */
export function i18n<Scope extends keyof Locale>(scope: Scope, key: keyof Locale[Scope], options?: TOptions | boolean): string | StringMap {
    if (typeof options === 'boolean')
        return i18next.t(`${scope}.${key}`, { returnObjects: true });

    return i18next.t(`${scope}.${key}`, options);
}

/**
 * Returns an origin hint function based on rounds information.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param skipFirstRound Whether to skip the first round.
 * @param matchLocation Location of the match.
 */
export function getOriginHint(roundNumber: number, roundCount: number, skipFirstRound: boolean, matchLocation: BracketType): OriginHint | undefined {
    if (roundNumber === 1) {
        if (matchLocation === 'single-bracket')
            return (position: number): string => i18n('origin-hint', 'seed', { position });

        if (matchLocation === 'winner-bracket')
            return (position: number): string => i18n('origin-hint', 'seed', { position });

        if (matchLocation === 'loser-bracket' && skipFirstRound)
            return (position: number): string => i18n('origin-hint', 'seed', { position });
    }

    if (isMajorRound(roundNumber) && matchLocation === 'loser-bracket') {
        if (roundNumber === roundCount - 2)
            return (position: number): string => i18n('origin-hint', 'winner-bracket-semi-final', { position });

        if (roundNumber === roundCount)
            return (): string => i18n('origin-hint', 'winner-bracket-final');

        const roundNumberWB = Math.ceil((roundNumber + 1) / 2);

        if (skipFirstRound)
            return (position: number): string => i18n('origin-hint', 'winner-bracket', { round: roundNumberWB - 1, position });

        return (position: number): string => i18n('origin-hint', 'winner-bracket', { round: roundNumberWB, position });
    }

    return undefined;
}

/**
 * Returns an origin hint function for a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 */
export function getFinalOriginHint(finalType: FinalType, roundNumber: number): OriginHint | undefined {
    // Single elimination.
    if (finalType === 'consolation_final')
        return (position: number): string => i18n('origin-hint', 'consolation-final', { position });

    // Double elimination.
    if (roundNumber === 1) // Grand Final round 1
        return (): string => i18n('origin-hint', 'grand-final');

    // Grand Final round 2 (no hint because it's obvious both participants come from the previous round)
    return undefined;
}

/**
 * Returns the label of a match.
 *
 * @param matchNumber Number of the match.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param matchLocation Location of the match.
 */
export function getMatchLabel(matchNumber: number, roundNumber: number, roundCount: number, matchLocation: BracketType): string {
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

/**
 * Returns the label of a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getFinalMatchLabel(finalType: FinalType, roundNumber: number, roundCount: number): string {
    // Single elimination.
    if (finalType === 'consolation_final')
        return i18n('match-label', 'consolation-final');

    // Double elimination.
    if (roundCount === 1)
        return i18n('match-label', 'grand-final-single');

    return i18n('match-label', 'grand-final', { roundNumber });
}

/**
 * Returns the status of a match.
 *
 * @param status The match status.
 */
export function getMatchStatus(status: Status): string {
    switch (status) {
        case Status.Locked:
            return i18n('match-status', 'locked');
        case Status.Waiting:
            return i18n('match-status', 'waiting');
        case Status.Ready:
            return i18n('match-status', 'ready');
        case Status.Running:
            return i18n('match-status', 'running');
        case Status.Completed:
            return i18n('match-status', 'completed');
        case Status.Archived:
            return i18n('match-status', 'archived');
        default:
            return 'Unknown status';
    }
}

/**
 * Returns the name of a group.
 *
 * @param groupNumber Number of the group.
 */
export function getGroupName(groupNumber: number): string {
    return i18n('common', 'group-name', { groupNumber });
}

/**
 * Returns the name of a round.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? i18n('common', 'round-name-final') : i18n('common', 'round-name', { roundNumber });
}

/**
 * Returns the name of a round in the winner bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getWinnerBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? i18n('common', 'round-name-winner-bracket-final') : i18n('common', 'round-name-winner-bracket', { roundNumber });
}

/**
 * Returns the name of a round in the loser bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getLoserBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? i18n('common', 'round-name-loser-bracket-final') : i18n('common', 'round-name-loser-bracket', { roundNumber });
}

/**
 * Abbreviations used in the viewer.
 */
export const abbreviations = {
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
export const bestOfX = (x: number): string => i18n('common', 'best-of-x', { x });

/**
 * The BYE literal.
 */
export const BYE = i18n('common', 'bye');

/**
 * Headers of the ranking.
 */
export const headers: RankingHeaders = {
    rank: i18n('ranking', 'rank', true) as RankingHeader,
    id: i18n('ranking', 'id', true) as RankingHeader,
    played: i18n('ranking', 'played', true) as RankingHeader,
    wins: i18n('ranking', 'wins', true) as RankingHeader,
    draws: i18n('ranking', 'draws', true) as RankingHeader,
    losses: i18n('ranking', 'losses', true) as RankingHeader,
    forfeits: i18n('ranking', 'forfeits', true) as RankingHeader,
    scoreFor: i18n('ranking', 'score-for', true) as RankingHeader,
    scoreAgainst: i18n('ranking', 'score-against', true) as RankingHeader,
    scoreDifference: i18n('ranking', 'score-difference', true) as RankingHeader,
    points: i18n('ranking', 'points', true) as RankingHeader,
};
