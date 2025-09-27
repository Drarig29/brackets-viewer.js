import i18next, { StringMap, TOptions, TFunction } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { Stage, Status, FinalType, GroupType, StageType } from 'brackets-model';
import { isMajorRound } from './helpers';
import { OriginHint, RoundNameInfo } from './types';

import en from './i18n/en/translation.json';
import fr from './i18n/fr/translation.json';

export type { TFunction } from 'i18next';

export const locales = {
    en,
    fr,
};

export type Locale = typeof locales['en'];

void i18next.use(LanguageDetector).init({
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
export async function addLocale(name: string, locale: Locale): Promise<void> {
    i18next.addResourceBundle(name, 'translation', locale, true, true);
    await i18next.changeLanguage();
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

export type ToI18nKey<S extends string> = S extends `${infer A}_${infer B}`
    ? `${A}-${B}`
    : never;

/**
 * Converts a type to a valid i18n key.
 *
 * @param key The key to convert.
 */
export function toI18nKey<S extends `${string}_${string}`>(key: S): ToI18nKey<S> {
    return key.replace('_', '-') as ToI18nKey<S>;
}

/**
 * Returns an origin hint function based on rounds information.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param skipFirstRound Whether to skip the first round.
 * @param matchLocation Location of the match.
 */
export function getOriginHint(roundNumber: number, roundCount: number, skipFirstRound: boolean, matchLocation: GroupType): OriginHint | undefined {
    if (roundNumber === 1) {
        if (matchLocation === 'single_bracket')
            return (position: number): string => t('origin-hint.seed', { position });

        if (matchLocation === 'winner_bracket')
            return (position: number): string => t('origin-hint.seed', { position });

        if (matchLocation === 'loser_bracket' && skipFirstRound)
            return (position: number): string => t('origin-hint.seed', { position });
    }

    if (isMajorRound(roundNumber) && matchLocation === 'loser_bracket') {
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
 * @param stageType Type of the stage.
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 */
export function getFinalOriginHint(stageType: StageType, finalType: FinalType, roundNumber: number): OriginHint | undefined {
    if (stageType === 'single_elimination')
        return (position: number): string => t('origin-hint.consolation-final', { position });

    // Double elimination.
    if (finalType === 'grand_final') {
        return roundNumber === 1
            ? (): string => t('origin-hint.grand-final') // Grand Final round 1
            : undefined; // Grand Final round 2 (no hint because it's obvious both participants come from the previous round)
    }

    // Consolation final in double elimination.
    return (position: number): string => position === 1
        ? t('origin-hint.double-elimination-consolation-final-opponent-1')
        : t('origin-hint.double-elimination-consolation-final-opponent-2');
}

/**
 * Returns the label of a match.
 *
 * @param matchNumber Number of the match.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param matchLocation Location of the match.
 */
export function getMatchLabel(matchNumber: number, roundNumber?: number, roundCount?: number, matchLocation?: GroupType): string {
    if (roundNumber === undefined || roundCount === undefined || matchLocation === undefined)
        return t('match-label.default', { matchNumber });

    const matchPrefix = matchLocation === 'winner_bracket' ? t('match-label.winner-bracket') :
        matchLocation === 'loser_bracket' ? t('match-label.loser-bracket') : t('match-label.standard-bracket');

    const inSemiFinalRound = roundNumber === roundCount - 1;
    const inFinalRound = roundNumber === roundCount;

    if (matchLocation === 'single_bracket') {
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
export function getBracketName(stage: Stage, type: GroupType): string | undefined {
    switch (type) {
        case 'winner_bracket':
        case 'loser_bracket':
            return t(`common.group-name-${toI18nKey(type)}`, { stage });
        default:
            return undefined;
    }
}

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns the name of a round.
 */
export function getRoundName({ roundNumber, roundCount }: RoundNameInfo, t: TFunction): string {
    return roundNumber === roundCount ? t('common.round-name-final') : t('common.round-name', { roundNumber });
}

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns the name of a round in the winner bracket of a double elimination stage.
 */
export function getWinnerBracketRoundName({ roundNumber, roundCount }: RoundNameInfo, t: TFunction): string {
    return roundNumber === roundCount ? t('common.round-name-winner-bracket-final') : t('common.round-name-winner-bracket', { roundNumber });
}

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns the name of a round in the loser bracket of a double elimination stage.
 */
export function getLoserBracketRoundName({ roundNumber, roundCount }: RoundNameInfo, t: TFunction): string {
    return roundNumber === roundCount ? t('common.round-name-loser-bracket-final') : t('common.round-name-loser-bracket', { roundNumber });
}
