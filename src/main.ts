import './style.scss';

import { defaultMinorOrdering, makePairs, ensureNotTied, ordering, ensurePowerOfTwoSized } from 'brackets-model';
import { OrderingType, Teams, BracketScores, TournamentData } from "brackets-model/dist/types";

interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}

const teamRefsDOM: { [key: string]: HTMLElement[] } = {};

(window as any).bracketsViewer = {
    render: (data: TournamentData) => {
        const root = $('.tournament');

        if (root.length === 0) {
            throw Error('Root not found. You must have a root element with class ".tournament"')
        }

        switch (data.type) {
            case 'double_elimination':
                renderDoubleElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.type}`);
        }
    }
}

function renderDoubleElimination(root: JQuery, data: TournamentData) {
    checkSizes(data);
    data.teams.map(team => teamRefsDOM[team] = []);

    root.append($('<h1>').text(data.name));
    const { losersWB, winnerWB } = renderWinnerBracket(root, data.teams, data.results[0]);
    const winnerLB = renderLoserBracket(root, losersWB, data.results[1], data.minorOrdering || defaultMinorOrdering[data.teams.length]);
    renderGrandFinal(winnerWB, winnerLB, data.results[2][0][0]);
}

/**
 * Renders the winner bracket (WB) and returns all the losers and the final winner.
 */
function renderWinnerBracket(root: JQuery, teams: Teams, results: BracketScores) {
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

            ensureNotTied(matchScores);

            if (matchScores[0] > matchScores[1]) {
                winners.push(opponents[0]);
                roundLosers.push(opponents[1]);
            } else if (matchScores[1] > matchScores[0]) {
                winners.push(opponents[1]);
                roundLosers.push(opponents[0]);
            }
        }

        winnerBracket.append(roundDOM);
        losers.push(roundLosers);
    }

    root.append(winnerBracket);

    return {
        losersWB: losers,
        winnerWB: winners[0]
    };
}

function renderLoserBracket(root: JQuery, fromWB: Teams[], results: BracketScores, minorOrdering: OrderingType[]) {
    const loserBracket = $('<div class="loser bracket">');

    let winners: Teams = [];
    let players: Teams[];

    for (let roundId = 0; roundId < results.length; roundId++) {
        const roundScores = results[roundId];

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

        for (let matchId = 0; matchId < roundScores.length; matchId++) {
            const opponents = players[matchId];
            const matchScores = roundScores[matchId];

            roundDOM.append(renderMatch(opponents, matchScores, {
                connectPrevious: roundId > 0,
                connectNext: roundId < results.length - 1,
            }));

            ensureNotTied(matchScores);

            if (matchScores[0] > matchScores[1]) {
                winners.push(opponents[0]);
            } else if (matchScores[1] > matchScores[0]) {
                winners.push(opponents[1]);
            }
        }

        loserBracket.append(roundDOM);
    }

    root.append(loserBracket);

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

function checkSizes(data: TournamentData) {
    ensurePowerOfTwoSized(data.teams);

    if (data.minorOrdering && data.minorOrdering.length !== Math.log2(data.teams.length)) {
        throw Error('Elements count in `minorOrdering` must be the same as the number of looser bracket\'s minor rounds.');
    }
}