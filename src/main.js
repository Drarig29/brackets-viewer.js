import './style.css';

const teamRefsDOM = {};

function renderTournament(data) {
    switch (data.type) {
        case 'double_elimination':
            renderDoubleElimination(data);
            break;
        default:
            throw Error('Type d\'arbre inconnu.');
    }
}

function renderDoubleElimination(data) {
    checkSizes(data);
    data.teams.map(team => teamRefsDOM[team] = []);

    $('section').append($('<h1>').text(data.name));
    const { losersWB, winnerWB } = renderWinnerBracket(data.teams, data.results[0]);
    const winnerLB = renderLoserBracket(losersWB, data.results[1], data.minorOrdering || defaultMinorOrdering[data.teams.length]);
    renderGrandFinal(winnerWB, winnerLB, data.results[2][0][0]);
}

/**
 * Affiche le winner bracket (WB) et renvoie les équipes sorties à chaque round.
 */
function renderWinnerBracket(teams, results) {
    const winnerBracket = $('<div class="winner bracket">');
    const losers = [];

    // Au début, tous les participants sont en WB.
    let winners = teams;
    let players;

    for (let roundId = 0; roundId < results.length; roundId++) {
        const round = results[roundId];

        // Les joueurs de ce round sont les gagnants du précédent.
        players = makePairs(winners);
        winners = [];

        const roundDOM = $('<div class="round">').append($('<h2>').text(`WB Round ${roundId + 1}`));
        const roundLosers = [];

        for (let matchId = 0; matchId < round.length; matchId++) {
            const opponents = players[matchId];
            const scores = round[matchId];

            roundDOM.append(renderMatch(opponents, scores, {
                connectPrevious: roundId > 0,
                connectNext: true,
            }));

            if (scores[0] > scores[1]) {
                // Première équipe gagne. L'autre passe en LB.
                winners.push(opponents[0]);
                roundLosers.push(opponents[1]);
            } else if (scores[1] > scores[0]) {
                // Deuxième équipe gagne. L'autre passe en LB.
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

function renderLoserBracket(fromWB, results, minorOrdering) {
    const loserBracket = $('<div class="loser bracket">');
    let players;
    let winners;

    for (let roundId = 0; roundId < results.length; roundId++) {
        const round = results[roundId];

        if (roundId === 0) {
            // Le premier tour LB fait s'affronter tous les perdants du premier tour WB.
            players = makePairs(ordering[minorOrdering[0]](fromWB[0]));
        } else if (roundId % 2 === 1) {
            // Chaque tour LB mineur fait s'affronter les gagnant du tour LB majeur précédent contre les perdants du tour WB correspondant.
            const roundWB = Math.ceil(roundId / 2);
            players = makePairs(ordering[minorOrdering[roundWB]](fromWB[roundWB]), winners);
        } else {
            // Chaque tour LB majeur fait s'affronter les gagnants du tour précédent.
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
                // Première équipe gagne.
                winners.push(opponents[0]);
            } else if (scores[1] > scores[0]) {
                // Deuxième équipe gagne.
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

function renderGrandFinal(winnerWB, winnerLB, scores) {
    const match = renderMatch([winnerWB, winnerLB], scores, {
        connectPrevious: true,
        connectNext: false,
    });

    const roundDOM = $('<div class="round">').append($('<h2>').text("Grande Finale"));
    roundDOM.append(match);

    $('.winner.bracket').append(roundDOM);
}

function renderMatch(opponents, scores, connection) {
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

function renderTeam(name, score, win) {
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

function makePairs(leftArray, rightArray) {
    if (!rightArray) {
        ensureEvenSized(leftArray);
        return leftArray.map((current, i) => (i % 2 === 0) ? [current, leftArray[i + 1]] : null)
            .filter(v => v !== null);
    }

    ensureEquallySized(leftArray, rightArray);
    return leftArray.map((current, i) => [current, rightArray[i]]);
}

function ensureEvenSized(array) {
    if (array.length % 2 === 1) {
        throw Error('La taille du tableau doit être paire.');
    }
}

function ensureEquallySized(leftArray, rightArray) {
    if (leftArray.length !== rightArray.length) {
        throw Error('La taille des tableaux doit être égale.');
    }
}

function checkSizes(data) {
    if (!Number.isInteger(Math.log2(data.teams.length))) {
        throw Error('Le nombre d\'équipes doit être une puissance de deux.');
    }

    if (data.minorOrdering && data.minorOrdering.length !== Math.log2(data.teams.length)) {
        throw Error('Le nombre d\'éléments dans minorOrdering doit correspondre au nombre de tours mineurs dans le loser bracket.');
    }
}

// https://web.archive.org/web/20200601102344/https://tl.net/forum/sc2-tournaments/202139-superior-double-elimination-losers-bracket-seeding

const ordering = {
    natural: array => [...array],
    reverse: array => array.reverse(),
    half_shift: array => [...array.slice(array.length / 2), ...array.slice(0, array.length / 2)],
    reverse_half_shift: array => [...array.slice(array.length / 2).reverse(), ...array.slice(0, array.length / 2).reverse()],
    pair_flip: array => {
        const result = [];
        for (let i = 0; i < array.length; i += 2) result.push(array[i + 1], array[i]);
        return result;
    },
}

const defaultMinorOrdering = {
    8: ['natural', 'reverse', 'natural'],
    16: ['natural', 'reverse_half_shift', 'reverse', 'natural'],
    32: ['natural', 'reverse', 'half_shift', 'natural', 'natural'],
    64: ['natural', 'reverse', 'half_shift', 'reverse', 'natural', 'natural'],
    128: ['natural', 'reverse', 'half_shift', 'pair_flip', 'pair_flip', 'pair_flip', 'natural'],
}