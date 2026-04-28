// ================= API =================

const MATCHES_API = 'https://localhost:7053/api/Sports/live';
const STANDINGS_API = 'https://localhost:7053/api/Standings';
const TEAMS_API = 'https://localhost:7053/api/Teams/search';

let allMatches = [];
let visibleCount = 9;

// ================= HEADER / BURGER =================

function setupHeader() {

    const burger = document.getElementById('burger');
    const overlay = document.getElementById('mobileOverlay');

    if (!burger || !overlay) return;

    burger.addEventListener('click', () => {

        burger.classList.toggle('open');

        overlay.classList.toggle('active');

        if (overlay.classList.contains('active')) {

            document.body.style.overflow = 'hidden';

        } else {

            document.body.style.overflow = 'auto';

        }

    });

    // CLOSE MENU ON LINK CLICK

    document.querySelectorAll('.mobile-nav-item').forEach(link => {

        link.addEventListener('click', () => {

            burger.classList.remove('open');

            overlay.classList.remove('active');

            document.body.style.overflow = 'auto';

        });

    });

    // HEADER SCROLL EFFECT

    window.addEventListener('scroll', () => {

        const header = document.querySelector('.glass-header');

        if (!header) return;

        if (window.scrollY > 50) {

            header.style.padding = '5px 0';

            header.style.background = 'rgba(0,0,0,0.95)';

        } else {

            header.style.padding = '10px 0';

            header.style.background = 'rgba(10,10,10,0.8)';

        }

    });

}

// ================= SEARCH =================

async function handleSearch() {

    const query = document.getElementById('mainSearch').value.trim();

    if (!query) return;

    document.querySelectorAll('.sport-content').forEach(section => {

        section.style.display = 'none';

    });

    document.getElementById('details-page').style.display = 'block';

    const container = document.getElementById('details-container');

    container.innerHTML = `
        <p style="color:#00ff85;">
            მიმდინარეობს ძებნა...
        </p>
    `;

    try {

        const response = await fetch(
            `${TEAMS_API}?name=${encodeURIComponent(query)}`
        );

        if (!response.ok) {

            throw new Error('გუნდი ვერ მოიძებნა');

        }

        const team = await response.json();

        const teamId = team.id || team.Id;

        container.innerHTML = `
            <div class="team-profile">

                <img
                    src="${team.crest}"
                    width="150"
                    onerror="this.src='https://img.icons8.com/ios-filled/100/ffffff/football2.png'"
                >

                <h1>${team.name}</h1>

                <div class="team-info">

                    <p>
                        <strong>🏟️ სტადიონი:</strong>
                        ${team.venue || 'N/A'}
                    </p>

                    <p>
                        <strong>📅 დაარსდა:</strong>
                        ${team.founded || 'N/A'}
                    </p>

                    <p>
                        <strong>🎨 ფერები:</strong>
                        ${team.clubColors || 'N/A'}
                    </p>

                    <p>
                        <strong>🌐 საიტი:</strong>

                        <a
                            href="${team.website}"
                            target="_blank"
                        >
                            გახსნა
                        </a>
                    </p>

                </div>

                <button
                    onclick="goToFullDetails(${teamId})"
                    class="see-more-style"
                >
                    სრული სტატისტიკა
                </button>

            </div>
        `;

    } catch (error) {

        container.innerHTML = `
            <p style="color:red;">
                ❌ ${error.message}
            </p>
        `;

    }

}

function goToFullDetails(teamId) {

    window.location.href = `team-details.html?id=${teamId}`;

}

function closeDetails() {

    document.getElementById('details-page').style.display = 'none';

    document.getElementById('football-page').style.display = 'block';

}

// ================= MATCHES =================

async function loadMatches() {

    try {

        const response = await fetch(MATCHES_API);

        allMatches = await response.json();

        renderMatches();

    } catch (error) {

        console.error(error);

    }

}

function renderMatches() {

    const container = document.getElementById('matches-container');

    if (!container) return;

    container.innerHTML = '';

    const placeholder =
        'https://img.icons8.com/ios-filled/100/00e676/football2.png';

    allMatches.slice(0, visibleCount).forEach(match => {

        container.innerHTML += `
            <div class="match-card">

                <div class="league-name">
                    ${match.league?.name || 'სხვა ლიგა'}
                </div>

                <div class="teams-area">

                    <div class="team">

                        <img
                            src="${match.homeTeam?.logoUrl || placeholder}"
                            class="team-logo"
                            onerror="this.src='${placeholder}'"
                        >

                        <div class="team-name">
                            ${match.homeTeam?.name}
                        </div>

                    </div>

                    <div class="score-area">

                        <div class="score-main">
                            ${match.score}
                        </div>

                        <div class="
                            status-badge
                            ${match.status === 1 ? 'bg-live' : 'bg-scheduled'}
                        ">

                            ${match.status === 1 ? 'LIVE' : 'SCHEDULED'}

                        </div>

                    </div>

                    <div class="team">

                        <img
                            src="${match.awayTeam?.logoUrl || placeholder}"
                            class="team-logo"
                            onerror="this.src='${placeholder}'"
                        >

                        <div class="team-name">
                            ${match.awayTeam?.name}
                        </div>

                    </div>

                </div>

            </div>
        `;

    });

    updateMatchesSeeMoreBtn();

}

function updateMatchesSeeMoreBtn() {

    let btn = document.getElementById('see-more-btn');

    const btnWrapper = document.getElementById('btn-wrapper');

    if (!btnWrapper) return;

    if (allMatches.length > visibleCount) {

        if (!btn) {

            btn = document.createElement('button');

            btn.id = 'see-more-btn';

            btn.innerText = 'მეტის ნახვა';

            btn.className = 'see-more-style';

            btn.onclick = () => {

                visibleCount += 9;

                renderMatches();

            };

            btnWrapper.appendChild(btn);

        }

    } else {

        if (btn) {

            btn.remove();

        }

    }

}

// ================= STANDINGS =================

async function loadStandings(leagueCode) {

    const tableBody = document.getElementById('standings-body');

    if (!tableBody) return;

    try {

        const response = await fetch(
            `${STANDINGS_API}/${leagueCode}`
        );

        const standings = await response.json();

        tableBody.innerHTML = standings.map(item => `
            <tr>

                <td>${item.position}</td>

                <td class="team-info">

                    <img
                        src="${item.teamLogo}"
                        width="25"
                    >

                    <span>${item.teamName}</span>

                </td>

                <td>${item.played}</td>
                <td>${item.won}</td>
                <td>${item.draw}</td>
                <td>${item.lost}</td>

                <td>
                    <strong>${item.points}</strong>
                </td>

            </tr>
        `).join('');

    } catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    მონაცემები ვერ ჩაიტვირთა
                </td>
            </tr>
        `;

    }

}

function changeLeague(code) {

    document.querySelectorAll('.tab-btn').forEach(btn => {

        btn.classList.remove('active');

    });

    if (event && event.target) {

        event.target.classList.add('active');

    }

    loadStandings(code);

}

// ================= TABLE UI =================

function setupTableUI() {

    const btn = document.getElementById('seeMoreBtn');

    const wrapper = document.getElementById('tableWrapper');

    if (!btn || !wrapper) return;

    btn.addEventListener('click', () => {

        wrapper.classList.toggle('expanded');

        if (wrapper.classList.contains('expanded')) {

            btn.textContent = 'SHOW LESS';

        } else {

            btn.textContent = 'SEE MORE';

        }

    });

}

// ================= FACTS =================

const facts = [

    'F1-ის პილოტი რბოლისას 3-4 კგ-ს იკლებს.',

    'პირველი კალათბურთი ატმის კალათებით ჩატარდა.',

    'ჩოგბურთის ყველაზე გრძელი მატჩი 11 საათი გაგრძელდა.'

];

let factIndex = 0;

function updateFacts() {

    const factDisplay = document.getElementById('fact-display');

    if (!factDisplay) return;

    factDisplay.innerText = facts[factIndex];

    factIndex++;

    if (factIndex >= facts.length) {

        factIndex = 0;

    }

}

// ================= HIGHLIGHTS =================

async function getHighlights() {

    const grid = document.getElementById('highlights-grid');

    if (!grid) return;

    try {

        const response = await fetch(
            'https://www.scorebat.com/video-api/v3/'
        );

        const data = await response.json();

        grid.innerHTML = '';

        const latestMatches = data.response.slice(0, 12);

        latestMatches.forEach(match => {

            const card = document.createElement('div');

            card.className = 'video-card';

            card.innerHTML = `
                <div
                    class="thumbnail-wrapper"
                    onclick="window.open('${match.matchviewUrl}','_blank')"
                >

                    <img
                        src="${match.thumbnail}"
                        alt="${match.title}"
                    >

                    <div class="play-button">
                        ▶
                    </div>

                </div>

                <div class="video-info">

                    <h3>${match.title}</h3>

                    <p>
                        🏆 ${match.competition}
                    </p>

                    <a
                        href="${match.matchviewUrl}"
                        target="_blank"
                        class="watch-link"
                    >
                        სრულად ნახვა →
                    </a>

                </div>
            `;

            grid.appendChild(card);

        });

    } catch (error) {

        grid.innerHTML = `
            <div class="loading">
                ვიდეოები ვერ ჩაიტვირთა 😕
            </div>
        `;

        console.error(error);

    }

}

// ================= INIT =================

document.addEventListener('DOMContentLoaded', () => {

    setupHeader();

    setupTableUI();

    loadMatches();

    loadStandings('PL');

    updateFacts();

    getHighlights();

    setInterval(updateFacts, 10000);

    setInterval(loadMatches, 30000);

});
