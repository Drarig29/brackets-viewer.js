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

interface Ranking {
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

type Headers = { [name in keyof Ranking]: Header };

const headers: Headers = {
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

export function rankingHeader(name: keyof Ranking): Header {
    return headers[name];
}

export function getRanking(matches: Match[], pointsFormula?: (ranking: Ranking) => number): Ranking[] {
    const teams: { [id: number]: Ranking } = {};

    function processTeam(current: ParticipantResult | null, other: ParticipantResult | null) {
        if (!current || current.id === null) return;

        const state = teams[current.id] || {
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

        const formula = pointsFormula || (
            (ranking: Ranking) => 3 * ranking.wins + 1 * ranking.draws + 0 * ranking.losses
        );

        state.points = formula(state);

        teams[current.id] = state;
    }

    for (const match of matches) {
        processTeam(match.opponent1, match.opponent2);
        processTeam(match.opponent2, match.opponent1);
    }

    const rankings = Object.values(teams).sort((a, b) => b.points - a.points);

    let rank = {
        value: 0,
        lastPoints: -1,
    };

    for (const ranking of rankings) {
        ranking.rank = rank.lastPoints !== ranking.points ? ++rank.value : rank.value;
        rank.lastPoints = ranking.points;
    }

    return rankings;
}