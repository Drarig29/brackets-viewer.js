import './style.scss';
import { Participant, Stage, Round, Match, MatchResults, ParticipantResult, ViewerData, GrandFinalType } from "brackets-model";

type ConnectionType = 'square' | 'straight' | false;

interface Connection {
    connectPrevious?: ConnectionType,
    connectNext?: ConnectionType,
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
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderElimination(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matchesByGroup = splitBy(data.matches, 'group_id');
        this.participants = data.participants;

        root.append($('<h1>').text(data.stage.name));

        if (data.stage.type === 'single_elimination') {
            const hasFinal = !!matchesByGroup[1];
            this.renderGroup(root, data.rounds, splitBy(matchesByGroup[0], "round_id"), round => `Round ${round.number}`);

            if (hasFinal) {
                this.renderFinal('consolation_final', matchesByGroup[1]);
            }
        } else if (data.stage.type === 'double_elimination') {
            const hasFinal = !!matchesByGroup[2];
            this.renderGroup(root, data.rounds, splitBy(matchesByGroup[0], "round_id"), round => `WB Round ${round.number}`, false, hasFinal);
            this.renderGroup(root, data.rounds, splitBy(matchesByGroup[1], "round_id"), round => `LB Round ${round.number}`, true);

            if (hasFinal) {
                this.renderFinal('grand_final', matchesByGroup[2]);
            }
        }
    }

    /**
     * Renders a bracket.
     */
    private renderGroup(root: JQuery, rounds: Round[], matchesByRound: Match[][], roundName: (round: Round) => string, lowerBracket?: boolean, connectFinal?: boolean) {
        const bracket = $('<div class="bracket">');

        for (const matches of matchesByRound) {
            const round = rounds.find(round => round.id === matches[0].round_id);
            if (!round) throw Error('Round not found.');

            const roundDOM = $('<div class="round">').append($('<h2>').text(roundName(round)));

            for (const match of matches) {
                let connection: Connection;

                if (lowerBracket) {
                    connection = {
                        connectPrevious: round.number > 1 && (round.number % 2 === 1 ? 'square' : 'straight'),
                        connectNext: round.number < matchesByRound.length && (round.number % 2 === 0 ? 'square' : 'straight'),
                    };
                } else {
                    connection = {
                        connectPrevious: round.number > 1 && 'square',
                        connectNext: round.number < matchesByRound.length ? 'square' : (connectFinal ? 'straight' : false),
                    };
                }

                roundDOM.append(this.renderMatch(match, connection));
            }

            bracket.append(roundDOM);
        }

        root.append(bracket);
    }

    private renderFinal(type: 'consolation_final' | 'grand_final', matches: Match[]) {
        const upperBracket = $('.bracket').eq(0);
        const grandFinalName = matches.length === 1 ? () => 'Grand Final' : (i: number) => `Grand Final R${i + 1}`;

        for (let i = 0; i < matches.length; i++) {
            const matchDOM = this.renderMatch(matches[i], {
                connectPrevious: type === 'grand_final' && (i === 0 && 'straight'),
                connectNext: matches.length === 2 && i === 0 && 'straight',
            });

            const roundDOM = $('<div class="round">').append($('<h2>').text(type === 'grand_final' ? grandFinalName(i) : 'Consolation Final'));
            roundDOM.append(matchDOM);

            upperBracket.append(roundDOM);
        }
    }

    private renderMatch(results: MatchResults, connection: Connection) {
        const team1 = this.renderTeam(results.opponent1);
        const team2 = this.renderTeam(results.opponent2);

        const teams = $('<div class="teams">').append(team1).append(team2);
        const match = $('<div class="match">').append(teams);

        if (!connection) return match;

        if (connection.connectPrevious)
            teams.addClass('connect-previous');

        if (connection.connectNext)
            match.addClass('connect-next');

        if (connection.connectPrevious === 'straight')
            teams.addClass('straight');

        if (connection.connectNext === 'straight')
            match.addClass('straight');

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