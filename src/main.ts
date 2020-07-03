import './style.scss';
import { Participant, Stage, Group, Round, Match, MatchGame, MatchResults, ParticipantResult } from "brackets-model";

interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}

interface TournamentData {
    group: Group[],
    round: Round[],
    match: Match[],
    match_game: MatchGame[],
    participant: Participant[],
}

const teamRefsDOM: { [key: number]: HTMLElement[] } = {};
let participants: Participant[];

// TODO: make a Viewer class

(window as any).bracketsViewer = {
    render: (stage: Stage, data: TournamentData) => {
        const root = $('.tournament');

        if (root.length === 0) {
            throw Error('Root not found. You must have a root element with class ".tournament"')
        }

        switch (stage.type) {
            case 'double_elimination':
                renderDoubleElimination(root, stage, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${stage.type}`);
        }
    }
}

function renderDoubleElimination(root: JQuery, stage: Stage, data: TournamentData) {
    data.participant.map(participant => teamRefsDOM[participant.id] = []);

    const matches = splitBy(data.match, 'group_id');
    participants = data.participant;

    root.append($('<h1>').text(stage.name));
    renderWinnerBracket(root, data.round, matches[0]);
    renderLoserBracket(root, data.round, matches[1]);

    renderGrandFinal(matches[2][0]);
}

/**
 * Renders the winner bracket (WB) and returns all the losers and the final winner.
 */
function renderWinnerBracket(root: JQuery, rounds: Round[], matches: Match[]) {
    const winnerBracket = $('<div class="winner bracket">');
    const splitted = splitBy(matches, "round_id");

    for (const roundMatches of splitted) {
        const round = rounds.find(round => round.id === roundMatches[0].round_id);
        if (!round) throw Error('Round not found.');

        const roundDOM = $('<div class="round">').append($('<h2>').text(`WB Round ${round.number}`));

        for (const match of roundMatches) {
            roundDOM.append(renderMatch(match, {
                connectPrevious: round.number > 1,
                connectNext: true,
            }));
        }

        winnerBracket.append(roundDOM);
    }

    root.append(winnerBracket);
}

function renderLoserBracket(root: JQuery, rounds: Round[], matches: Match[]) {
    const loserBracket = $('<div class="loser bracket">');
    const splitted = splitBy(matches, "round_id");

    for (const roundMatches of splitted) {
        const round = rounds.find(round => round.id === roundMatches[0].round_id);
        if (!round) throw Error('Round not found.');

        const roundDOM = $('<div class="round">').append($('<h2>').text(`LB Round ${round.number}`));

        for (const match of roundMatches) {
            roundDOM.append(renderMatch(match, {
                connectPrevious: round.number > 1,
                connectNext: round.number < splitted.length,
            }));
        }

        loserBracket.append(roundDOM);
    }

    root.append(loserBracket);
}

function renderGrandFinal(match: Match) {
    const matchDOM = renderMatch(match, {
        connectPrevious: true,
        connectNext: false,
    });

    const roundDOM = $('<div class="round">').append($('<h2>').text("Grand Final"));
    roundDOM.append(matchDOM);

    $('.winner.bracket').append(roundDOM);
}

function renderMatch(results: MatchResults, connection: Connection) {
    const team1 = renderTeam(results.opponent1);
    const team2 = renderTeam(results.opponent2);

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

function renderTeam(team: ParticipantResult | null) {
    const teamDOM = $(`<div class="team">`);
    const nameDOM = $('<div class="name">');
    const scoreDOM = $('<div class="score">');

    if (team === null) {
        nameDOM.text('BYE');
    } else {
        const participant = participants.find(participant => participant.id === team.id);
        nameDOM.text(participant === undefined ? 'TBD' : participant.name);
        scoreDOM.text(team.score || '');

        if (team.result && team.result === 'win') {
            nameDOM.addClass('win');
            scoreDOM.addClass('win');
        }
    }

    teamDOM.append(nameDOM).append(scoreDOM);

    if (team && team.id !== null) {
        const id = team.id;
        teamRefsDOM[id].push(teamDOM.get(0));
        teamDOM.hover(
            () => $(teamRefsDOM[id]).addClass('hover'),
            () => $(teamRefsDOM[id]).removeClass('hover'),
        );
    }

    return teamDOM;
}

function splitBy<T>(array: T[], key: keyof T): T[][] {
    const obj = Object();

    for (const value of array) {
        if (!obj[value[key]])
            obj[value[key]] = [];

        obj[value[key]].push(value);
    }

    return Object.values(obj);
}