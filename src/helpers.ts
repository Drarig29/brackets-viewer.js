import { Match, ParticipantResult } from "brackets-model";

export function splitBy<T>(array: T[], key: keyof T): T[][] {
    const obj = Object();

    for (const value of array) {
        if (!obj[value[key]])
            obj[value[key]] = [];

        obj[value[key]].push(value);
    }

    return Object.values(obj);
}

export function isMajorRound(roundNumber: number) {
    return roundNumber === 1 || roundNumber % 2 === 0;
}

const headers: RankingHeaders = {
    'rank': {
        value: '#',
        tooltip: 'Rank',
    },
    'id': {
        value: 'Name',
        tooltip: 'Name',
    },
    'played': {
        value: 'P',
        tooltip: 'Played',
    },
    'wins': {
        value: 'W',
        tooltip: 'Wins',
    },
    'draws': {
        value: 'D',
        tooltip: 'Draws',
    },
    'losses': {
        value: 'L',
        tooltip: 'Losses',
    },
    'forfeits': {
        value: 'F',
        tooltip: 'Forfeits',
    },
    'scoreFor': {
        value: 'SF',
        tooltip: 'Score For',
    },
    'scoreAgainst': {
        value: 'SA',
        tooltip: 'Score Against',
    },
    'scoreDifference': {
        value: '+/-',
        tooltip: 'Score Difference',
    },
    'points': {
        value: 'Pts',
        tooltip: 'Points',
    },
}

export function rankingHeader(name: keyof RankingItem): Header {
    return headers[name];
}

export function getRanking(matches: Match[], formula?: RankingFormula): Ranking {
    formula = formula || (
        (item: RankingItem) => 3 * item.wins + 1 * item.draws + 0 * item.losses
    );

    const rankingMap: RankingMap = {};

    for (const match of matches) {
        processTeam(rankingMap, formula, match.opponent1, match.opponent2);
        processTeam(rankingMap, formula, match.opponent2, match.opponent1);
    }

    return createRanking(rankingMap);
}

function createRanking(rankingMap: RankingMap) {
    const ranking = Object.values(rankingMap).sort((a, b) => b.points - a.points);
    
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

function processTeam(rankingMap: RankingMap, formula: RankingFormula, current: ParticipantResult | null, other: ParticipantResult | null) {
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