/**
 * The data to display with `brackets-viewer.js`
 */
interface ViewerData {
    /** The stage to display. */
    stage: import('brackets-model').Stage,
    
    /** The matches of the stage to display. */
    matches: import('brackets-model').Match[],

    /** The games of the matches to display. */
    matchGames: import('brackets-model').MatchGame[],

    /** The participants who play in the stage to display. */
    participants: import('brackets-model').Participant[],
}

type Placement = 'none' | 'before' | 'after';

/**
 * An optional config to provide to `brackets-viewer.js`
 */
interface Config {
    /**
     * Where the position of a participant is placed relative to its name.
     * - If `none`, the position is not added.
     * - If `before`, the position is prepended before the team name. "#1 Team"
     * - If `after`, the position is appended after the team name, in parentheses. "Team (#1)"
     */
    participantOriginPlacement: Placement,

    /**
     * Whether to show the origin of a slot (wherever possible).
     */
    showSlotsOrigin: boolean,

    /**
     * Whether to show the origin of a slot (in the lower bracket of an elimination stage).
     */
    showLowerBracketSlotsOrigin: boolean,

    /**
     * Whether to highlight every instance of a participant on hover.
     */
    highlightParticipantOnHover: boolean,
}

type ConnectionType = 'square' | 'straight' | false;
type FinalType = 'consolation_final' | 'grand_final';
type MatchHint = ((i: number) => string) | undefined;

interface Connection {
    connectPrevious?: ConnectionType,
    connectNext?: ConnectionType,
}

interface RankingItem {
    [prop: string]: number,
    rank: number,
    id: number,
    played: number,
    wins: number,
    draws: number,
    losses: number,
    forfeits: number,
    scoreFor: number,
    scoreAgainst: number,
    scoreDifference: number,
    points: number,
}

interface Header {
    value: string,
    tooltip: string,
}

type RankingFormula = (ranking: RankingItem) => number;
type RankingHeaders = { [name in keyof RankingItem]: Header };
type RankingMap = { [id: number]: RankingItem };
type Ranking = RankingItem[];