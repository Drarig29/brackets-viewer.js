import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, ViewerData } from "brackets-model";
import { splitBy, getRanking, rankingHeader } from "./helpers";

type ConnectionType = 'square' | 'straight' | false;

interface Connection {
    connectPrevious?: ConnectionType,
    connectNext?: ConnectionType,
}

class BracketsViewer {

    readonly teamRefsDOM: { [key: number]: HTMLElement[] } = {};
    private participants!: Participant[];

    public render(data: ViewerData) {
        const root = $('#root');

        if (root.length === 0) {
            throw Error('Root not found. You must have a root element with id "root"')
        }

        switch (data.stage.type) {
            case 'round_robin':
                this.renderRoundRobin(root, data);
                break;
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderRoundRobin(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        this.participants = data.participants;

        const container = $('<div class="round-robin">');
        let groupNumber = 1;

        for (const group of splitBy(data.matches, 'group_id')) {
            const groupDOM = $('<section class="group">').append($('<h2>').text(`Group ${groupNumber++}`));;
            let roundNumber = 1;

            for (const round of splitBy(group, 'round_id')) {
                const roundDOM = $('<article class="round">').append($('<h3>').text(`Round ${roundNumber}`));

                for (const match of round) {
                    roundDOM.append(this.renderMatch(match));
                }

                groupDOM.append(roundDOM);
                roundNumber++;
            }

            groupDOM.append(this.renderTable(group));
            container.append(groupDOM);
        }

        root.append($('<h1>').text(data.stage.name));
        root.append(container);
    }

    private renderTable(matches: Match[]) {
        const rankings = getRanking(matches);
        const table = $('<table>');
        const headers = $('<tr>');

        for (const prop in rankings[0])
            headers.append($('<th>').text(rankingHeader(prop as any)));

        table.append(headers);

        for (const ranking of rankings) {
            const row = $('<tr>');

            for (const prop in ranking) {
                let data: number | string = ranking[prop];

                if (prop === 'id') {
                    const participant = this.participants.find(team => team.id === data);
                    if (participant !== undefined)
                        data = participant.name;
                }

                row.append($('<td>').text(data));
            }

            table.append(row);
        }

        return table;
    }

    private renderElimination(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matchesByGroup = splitBy(data.matches, 'group_id');
        this.participants = data.participants;

        root.append($('<h1>').text(data.stage.name));

        if (data.stage.type === 'single_elimination') {
            const hasFinal = !!matchesByGroup[1];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `Round ${number}`);

            if (hasFinal) {
                this.renderFinal('consolation_final', matchesByGroup[1]);
            }
        } else if (data.stage.type === 'double_elimination') {
            const hasFinal = !!matchesByGroup[2];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `WB Round ${number}`, false, hasFinal);
            this.renderBracket(root, splitBy(matchesByGroup[1], "round_id"), number => `LB Round ${number}`, true);

            if (hasFinal) {
                this.renderFinal('grand_final', matchesByGroup[2]);
            }
        }
    }

    /**
     * Renders a bracket.
     */
    private renderBracket(root: JQuery, matchesByRound: Match[][], roundName: (roundNumber: number) => string, lowerBracket?: boolean, connectFinal?: boolean) {
        const bracket = $('<section class="bracket">');

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const roundDOM = $('<article class="round">').append($('<h3>').text(roundName(roundNumber)));

            for (const match of matches) {
                let connection: Connection;

                if (lowerBracket) {
                    connection = {
                        connectPrevious: roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight'),
                        connectNext: roundNumber < matchesByRound.length && (roundNumber % 2 === 0 ? 'square' : 'straight'),
                    };
                } else {
                    connection = {
                        connectPrevious: roundNumber > 1 && 'square',
                        connectNext: roundNumber < matchesByRound.length ? 'square' : (connectFinal ? 'straight' : false),
                    };
                }

                roundDOM.append(this.renderMatch(match, connection));
            }

            bracket.append(roundDOM);
            roundNumber++;
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

            const roundDOM = $('<article class="round">').append($('<h3>').text(type === 'grand_final' ? grandFinalName(i) : 'Consolation Final'));
            roundDOM.append(matchDOM);

            upperBracket.append(roundDOM);
        }
    }

    private renderMatch(results: MatchResults, connection?: Connection) {
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
            scoreDOM.text(team.score === undefined ? '-' : team.score);

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

(window as any).bracketsViewer = new BracketsViewer();