import './style.scss';
import { Participant, Stage, Round, Match, MatchResults, ParticipantResult, ViewerData } from "brackets-model";

interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}

class BracketsViewer {

    readonly teamRefsDOM: { [key: number]: HTMLElement[] } = {};
    private participants!: Participant[];

    public render(data: ViewerData) {
        const root = $('.tournament');

        if (root.length === 0) {
            throw Error('Root not found. You must have a root element with class ".tournament"')
        }

        switch (data.stage.type) {
            case 'double_elimination':
                this.renderDoubleElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderDoubleElimination(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matches = splitBy(data.matches, 'group_id');
        this.participants = data.participants;

        root.append($('<h1>').text(data.stage.name));
        this.renderWinnerBracket(root, data.rounds, matches[0]);
        this.renderLoserBracket(root, data.rounds, matches[1]);

        this.renderGrandFinal(matches[2][0]);
    }

    /**
     * Renders the winner bracket (WB) and returns all the losers and the final winner.
     */
    private renderWinnerBracket(root: JQuery, rounds: Round[], matches: Match[]) {
        const winnerBracket = $('<div class="winner bracket">');
        const splitted = splitBy(matches, "round_id");

        for (const roundMatches of splitted) {
            const round = rounds.find(round => round.id === roundMatches[0].round_id);
            if (!round) throw Error('Round not found.');

            const roundDOM = $('<div class="round">').append($('<h2>').text(`WB Round ${round.number}`));

            for (const match of roundMatches) {
                roundDOM.append(this.renderMatch(match, {
                    connectPrevious: round.number > 1,
                    connectNext: true,
                }));
            }

            winnerBracket.append(roundDOM);
        }

        root.append(winnerBracket);
    }

    private renderLoserBracket(root: JQuery, rounds: Round[], matches: Match[]) {
        const loserBracket = $('<div class="loser bracket">');
        const splitted = splitBy(matches, "round_id");

        for (const roundMatches of splitted) {
            const round = rounds.find(round => round.id === roundMatches[0].round_id);
            if (!round) throw Error('Round not found.');

            const roundDOM = $('<div class="round">').append($('<h2>').text(`LB Round ${round.number}`));

            for (const match of roundMatches) {
                roundDOM.append(this.renderMatch(match, {
                    connectPrevious: round.number > 1,
                    connectNext: round.number < splitted.length,
                }));
            }

            loserBracket.append(roundDOM);
        }

        root.append(loserBracket);
    }

    private renderGrandFinal(match: Match) {
        const matchDOM = this.renderMatch(match, {
            connectPrevious: true,
            connectNext: false,
        });

        const roundDOM = $('<div class="round">').append($('<h2>').text("Grand Final"));
        roundDOM.append(matchDOM);

        $('.winner.bracket').append(roundDOM);
    }

    private renderMatch(results: MatchResults, connection: Connection) {
        const team1 = this.renderTeam(results.opponent1);
        const team2 = this.renderTeam(results.opponent2);

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

    private renderTeam(team: ParticipantResult | null) {
        const teamDOM = $(`<div class="team">`);
        const nameDOM = $('<div class="name">');
        const scoreDOM = $('<div class="score">');

        if (team === null) {
            nameDOM.text('BYE');
        } else {
            const participant = this.participants.find(participant => participant.id === team.id);
            nameDOM.text(participant === undefined ? 'TBD' : participant.name);
            scoreDOM.text(team.score || '');

            if (team.result && team.result === 'win') {
                nameDOM.addClass('win');
                scoreDOM.addClass('win');
            }

            if (team.result && team.result === 'loss') {
                nameDOM.addClass('loss');
                scoreDOM.addClass('loss');
            }
        }

        teamDOM.append(nameDOM).append(scoreDOM);

        if (team && team.id !== null) {
            const id = team.id;
            this.teamRefsDOM[id].push(teamDOM.get(0));
            teamDOM.hover(
                () => $(this.teamRefsDOM[id]).addClass('hover'),
                () => $(this.teamRefsDOM[id]).removeClass('hover'),
            );
        }

        return teamDOM;
    }
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

(window as any).bracketsViewer = new BracketsViewer();