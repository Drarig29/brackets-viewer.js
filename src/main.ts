import './style.scss';

const teamRefsDOM: { [key: string]: HTMLElement[] } = {};

(window as any).bracketsViewer = {
    render: (data: TournamentData) => {
        switch (data.type) {
            case 'double_elimination':
                renderDoubleElimination(data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.type}`);
        }
    }
}

function renderDoubleElimination(data: TournamentData) {
    checkSizes(data);
    data.teams.map(team => teamRefsDOM[team] = []);

    $('section').append($('<h1>').text(data.name));
    const { losersWB, winnerWB } = renderWinnerBracket(data.teams, data.results[0]);
    const winnerLB = renderLoserBracket(losersWB, data.results[1], data.minorOrdering || defaultMinorOrdering[data.teams.length]);
    renderGrandFinal(winnerWB, winnerLB, data.results[2][0][0]);
}

/**
 * Renders the winner bracket (WB) and returns all the losers and the final winner.
 */
function renderWinnerBracket(teams: Teams, results: BracketScores) {
    const winnerBracket = $('<div class="winner bracket">');
    const losers: Teams[] = [];

    // At first, all players play in WB.
    let winners = teams;
    let players: Teams[];

    for (let roundId = 0; roundId < results.length; roundId++) {
        const roundScores = results[roundId];

        // Players of this round are the last one's winners.
        players = makePairs(winners);
        winners = [];

        const roundDOM = $('<div class="round">').append($('<h2>').text(`WB Round ${roundId + 1}`));
        const roundLosers = [];

        for (let matchId = 0; matchId < roundScores.length; matchId++) {
            const opponents = players[matchId];
            const matchScores = roundScores[matchId];

            roundDOM.append(renderMatch(opponents, matchScores, {
                connectPrevious: roundId > 0,
                connectNext: true,
            }));

            if (matchScores[0] > matchScores[1]) {
                winners.push(opponents[0]);
                roundLosers.push(opponents[1]);
            } else if (matchScores[1] > matchScores[0]) {
                winners.push(opponents[1]);
                roundLosers.push(opponents[0]);
            } else {
                throw Error(`${opponents[matchId][0]} et ${opponents[matchId][1]} sont à égalité !`);
            }
        }

        winnerBracket.append(roundDOM);
        losers.push(roundLosers);
    }

    $('section').append(winnerBracket);

    return {
        losersWB: losers,
        winnerWB: winners[0]
    };
}

function renderLoserBracket(fromWB: Teams[], results: BracketScores, minorOrdering: OrderingType[]) {
    const loserBracket = $('<div class="loser bracket">');

    let winners: Teams = [];
    let players: Teams[];

    for (let roundId = 0; roundId < results.length; roundId++) {
        const round = results[roundId];

        if (roundId === 0) {
            // In the first LB round are the losers from the first WB round.
            players = makePairs(ordering[minorOrdering[0]](fromWB[0]));
        } else if (roundId % 2 === 1) {
            // Each minor LB round matches the winners of the previous major LB round against the losers of the corresponding WB round. 
            const roundWB = Math.ceil(roundId / 2);
            players = makePairs(ordering[minorOrdering[roundWB]](fromWB[roundWB]), winners);
        } else {
            // Each major LB round matches the winners of the previous round.
            players = makePairs(winners);
        }

        winners = [];

        const roundDOM = $('<div class="round">').append($('<h2>').text(`LB Round ${roundId + 1}`));

        for (let matchId = 0; matchId < round.length; matchId++) {
            const opponents = players[matchId];
            const scores = round[matchId];

            roundDOM.append(renderMatch(opponents, scores, {
                connectPrevious: roundId > 0,
                connectNext: roundId < results.length - 1,
            }));

            if (scores[0] > scores[1]) {
                winners.push(opponents[0]);
            } else if (scores[1] > scores[0]) {
                winners.push(opponents[1]);
            } else {
                throw Error(`${opponents[matchId][0]} et ${opponents[matchId][1]} sont à égalité !`);
            }
        }

        loserBracket.append(roundDOM);
    }

    $('section').append(loserBracket);

    return winners[0];
}

function renderGrandFinal(winnerWB: string, winnerLB: string, scores: number[]) {
    const match = renderMatch([winnerWB, winnerLB], scores, {
        connectPrevious: true,
        connectNext: false,
    });

    const roundDOM = $('<div class="round">').append($('<h2>').text("Grand Final"));
    roundDOM.append(match);

    $('.winner.bracket').append(roundDOM);
}

function renderMatch(opponents: string[], scores: number[], connection: Connection) {
    const team1 = renderTeam(opponents[0], scores[0], scores[0] > scores[1]);
    const team2 = renderTeam(opponents[1], scores[1], scores[1] > scores[0]);

    const teams = $('<div class="teams">').append(team1).append(team2);
    const match = $('<div class="match">').append(teams);

    if (connection && connection.connectPrevious) {
        teams.addClass('connect-previous');
    }

    if (connection && connection.connectNext) {
        match.addClass('connect-next');
    }

    return match;
}

function renderTeam(name: string, score: number, win: boolean) {
    const nameDOM = $('<div class="name">').text(name);
    const scoreDOM = $('<div class="score">').text(score);

    if (win) {
        nameDOM.addClass('win');
        scoreDOM.addClass('win');
    }

    const team = $(`<div class="team">`).append(nameDOM).append(scoreDOM);
    teamRefsDOM[name].push(team.get(0));

    return team.hover(
        () => $(teamRefsDOM[name]).addClass('hover'),
        () => $(teamRefsDOM[name]).removeClass('hover'),
    );
}

/**
 * Makes pairs with each element and its next one.
 * @example [1, 2, 3, 4] --> [[1, 2], [3, 4]]
 */
function makePairs(array: any[]): any[][];

/**
 * Makes pairs with one element from `left` and the other from `right`.
 * @example [1, 2] + [3, 4] --> [[1, 3], [2, 4]]
 */
function makePairs(left: any[], right: any[]): any[][];

function makePairs(left: any[], right?: any[]): any[][] {
    if (!right) {
        ensureEvenSized(left);
        return left.map((current, i) => (i % 2 === 0) ? [current, left[i + 1]] : [])
            .filter(v => v.length > 0);
    }

    ensureEquallySized(left, right);
    return left.map((current, i) => [current, right[i]]);
}

function ensureEvenSized(array: any[]) {
    if (array.length % 2 === 1) {
        throw Error('La taille du tableau doit être paire.');
    }
}

function ensureEquallySized(left: any[], right: any[]) {
    if (left.length !== right.length) {
        throw Error('La taille des tableaux doit être égale.');
    }
}

function checkSizes(data: TournamentData) {
    if (!Number.isInteger(Math.log2(data.teams.length))) {
        throw Error('Le nombre d\'équipes doit être une puissance de deux.');
    }

    if (data.minorOrdering && data.minorOrdering.length !== Math.log2(data.teams.length)) {
        throw Error('Le nombre d\'éléments dans minorOrdering doit correspondre au nombre de tours mineurs dans le loser bracket.');
    }
}

// https://web.archive.org/web/20200601102344/https://tl.net/forum/sc2-tournaments/202139-superior-double-elimination-losers-bracket-seeding

const ordering = {
    natural: (array: any[]) => [...array],
    reverse: (array: any[]) => array.reverse(),
    half_shift: (array: any[]) => [...array.slice(array.length / 2), ...array.slice(0, array.length / 2)],
    reverse_half_shift: (array: any[]) => [...array.slice(array.length / 2).reverse(), ...array.slice(0, array.length / 2).reverse()],
    pair_flip: (array: any[]) => {
        const result = [];
        for (let i = 0; i < array.length; i += 2) result.push(array[i + 1], array[i]);
        return result;
    },
}

const defaultMinorOrdering: { [key: number]: OrderingType[] } = {
    8: ['natural', 'reverse', 'natural'],
    16: ['natural', 'reverse_half_shift', 'reverse', 'natural'],
    32: ['natural', 'reverse', 'half_shift', 'natural', 'natural'],
    64: ['natural', 'reverse', 'half_shift', 'reverse', 'natural', 'natural'],
    128: ['natural', 'reverse', 'half_shift', 'pair_flip', 'pair_flip', 'pair_flip', 'natural'],
}