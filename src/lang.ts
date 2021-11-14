import i18next, { StringMap, TOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { Stage, Status } from 'brackets-model';
import { isMajorRound } from './helpers';
import { FinalType, BracketType, OriginHint } from './types';

import en from './i18n/en/translation.json';
import fr from './i18n/fr/translation.json';

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
});

/**
 * Adds a locale to the available i18n bundles.
 * 
 * @param name Name of the locale.
 * @param locale Contents of the locale.
 */
export function addLocale(name: string, locale: Locale): void {
    i18next.addResourceBundle(name, 'translation', locale, true, true);
    i18next.changeLanguage();
}

/**
 * Returns an internationalized version of a locale key.
 * 
 * @param key A locale key.
 * @param options Data to pass to the i18n process.
 */
export function t<Scope extends keyof Locale, SubKey extends string & keyof Locale[Scope], T extends TOptions>(
    key: `${Scope}.${SubKey}`, options?: T,
): T['returnObjects'] extends true ? StringMap : string {
    return i18next.t(key, options);
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
            return (position: number): string => t('origin-hint.seed', { position });

        if (matchLocation === 'winner-bracket')
            return (position: number): string => t('origin-hint.seed', { position });

        if (matchLocation === 'loser-bracket' && skipFirstRound)
            return (position: number): string => t('origin-hint.seed', { position });
    }

    if (isMajorRound(roundNumber) && matchLocation === 'loser-bracket') {
        if (roundNumber === roundCount - 2)
            return (position: number): string => t('origin-hint.winner-bracket-semi-final', { position });

        if (roundNumber === roundCount)
            return (): string => t('origin-hint.winner-bracket-final');

        const roundNumberWB = Math.ceil((roundNumber + 1) / 2);

        if (skipFirstRound)
            return (position: number): string => t('origin-hint.winner-bracket', { round: roundNumberWB - 1, position });

        return (position: number): string => t('origin-hint.winner-bracket', { round: roundNumberWB, position });
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
        return (position: number): string => t('origin-hint.consolation-final', { position });

    // Double elimination.
    if (roundNumber === 1) // Grand Final round 1
        return (): string => t('origin-hint.grand-final');

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
    const matchPrefix = matchLocation === 'winner-bracket' ? t('match-label.winner-bracket') :
        matchLocation === 'loser-bracket' ? t('match-label.loser-bracket') : t('match-label.standard-bracket');

    const inSemiFinalRound = roundNumber === roundCount - 1;
    const inFinalRound = roundNumber === roundCount;

    if (matchLocation === 'single-bracket') {
        if (inSemiFinalRound)
            return t('match-label.standard-bracket-semi-final', { matchNumber });

        if (inFinalRound)
            return t('match-label.standard-bracket-final');
    }

    if (inSemiFinalRound)
        return t('match-label.double-elimination-semi-final', { matchPrefix, matchNumber });

    if (inFinalRound)
        return t('match-label.double-elimination-final', { matchPrefix });

    return t('match-label.double-elimination', { matchPrefix, roundNumber, matchNumber });
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
        return t('match-label.consolation-final');

    // Double elimination.
    if (roundCount === 1)
        return t('match-label.grand-final-single');

    return t('match-label.grand-final', { roundNumber });
}

/**
 * Returns the status of a match.
 *
 * @param status The match status.
 */
export function getMatchStatus(status: Status): string {
    switch (status) {
        case Status.Locked:
            return t('match-status.locked');
        case Status.Waiting:
            return t('match-status.waiting');
        case Status.Ready:
            return t('match-status.ready');
        case Status.Running:
            return t('match-status.running');
        case Status.Completed:
            return t('match-status.completed');
        case Status.Archived:
            return t('match-status.archived');
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
    return t('common.group-name', { groupNumber });
}


/**
 * Returns the name of the bracket.
 * 
 * @param stage The current stage.
 * @param type Type of the bracket.
 */
export function getBracketName(stage: Stage, type: BracketType): string | undefined {
    switch (type) {
        case 'winner-bracket':
        case 'loser-bracket':
            return t(`common.group-name-${type}`, { stage });
        default:
            return undefined;
    }
}

/**
 * Returns the name of a round.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? t('common.round-name-final') : t('common.round-name', { roundNumber });
}

/**
 * Returns the name of a round in the winner bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getWinnerBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? t('common.round-name-winner-bracket-final') : t('common.round-name-winner-bracket', { roundNumber });
}

/**
 * Returns the name of a round in the loser bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getLoserBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? t('common.round-name-loser-bracket-final') : t('common.round-name-loser-bracket', { roundNumber });
}
