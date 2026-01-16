const App = {
    currentFileId: null,
    planType: 'academico',

    init() {
        console.log("Sistema Iniciado");
        UI.setLoading(true, "Iniciando Sistema...");

        // Timeout de segurança para remover o loading se o Google demorar
        const safetyTimeout = setTimeout(() => {
            if (!document.getElementById('loadingOverlay').classList.contains('hidden')) {
                document.getElementById('spinner').classList.add('hidden');
                document.getElementById('loadingActions').classList.remove('hidden');
            }
        }, 10000);

        GoogleAPI.init(() => {
            clearTimeout(safetyTimeout);
            UI.setLoading(false);
            UI.showScreen('loginScreen');
        });

        // Event listeners
        const financeiroTab = document.getElementById('tab-financeiro');
        if (financeiroTab) {
            financeiroTab.addEventListener('input', () => this.calcLucro());
        }
    },

    async login() {
        GoogleAPI.login(async (resp) => {
            UI.setLoading(true, "Acessando Drive...");
            try {
                const user = await GoogleAPI.getUserInfo();
                UI.updateUserDisplay(user);
                await this.refreshDashboard();
                UI.showScreen('dashboardScreen');
                UI.showToast(`Bem-vindo, ${user.given_name}!`);
            } catch (e) {
                console.error(e);
                UI.showToast("Erro ao carregar dados do usuário ou arquivos.", "error");
            }
            UI.setLoading(false);
        });
    },

    async logout() {
        GoogleAPI.logout();
    },

    async refreshDashboard() {
        try {
            const files = await GoogleAPI.listFiles();
            UI.renderFileList(files, (id) => this.loadFile(id), (id) => this.deleteFile(id));
        } catch (e) {
            console.error(e);
            UI.showToast("Erro ao listar arquivos.", "error");
        }
    },

    newPlan() {
        this.currentFileId = null;
        UI.clearForm();
        UI.setProjectTitle("Novo Projeto");
        UI.showScreen('purposeScreen');
    },

    goToEditor(type) {
        this.planType = type;
        UI.showScreen('editorScreen');
        UI.openTab('identificacao', document.querySelector('.nav-tab'));
        this.applyTemplate(type);
    },

    applyTemplate(type) {
        const guideIdent = document.querySelector('#tab-identificacao .guide-box p');
        const guideMercado = document.querySelector('#tab-mercado .guide-box p');

        if (type === 'academico') {
            if (guideIdent) guideIdent.innerText = "Foco em fundamentação teórica e justificativa acadêmica.";
            if (guideMercado) guideMercado.innerText = "Análise teórica do nicho e tendências.";
        } else {
            if (guideIdent) guideIdent.innerText = "Foco em viabilidade prática e execução de mercado.";
            if (guideMercado) guideMercado.innerText = "Análise direta de concorrentes reais e personas.";
        }
    },

    async saveProject() {
        const data = UI.getFormData();
        const name = data['campo_nome'] || 'Sem Nome';

        UI.setLoading(true, "Salvando...");
        try {
            const result = await GoogleAPI.saveFile(name, data, this.currentFileId);
            if (!this.currentFileId) this.currentFileId = result.id;
            UI.setProjectTitle(name);
            UI.showToast("Projeto salvo com sucesso!");
        } catch (e) {
            console.error(e);
            UI.showToast("Erro ao salvar o projeto.", "error");
        }
        UI.setLoading(false);
    },

    async loadFile(id) {
        UI.setLoading(true, "Abrindo...");
        this.currentFileId = id;
        try {
            const data = await GoogleAPI.getFile(id);
            UI.fillFormData(data);
            UI.setProjectTitle(data['campo_nome'] || 'Projeto Carregado');
            UI.showScreen('editorScreen');
            this.calcLucro();
            UI.showToast("Projeto carregado!");
        } catch (e) {
            console.error(e);
            UI.showToast("Erro ao abrir o arquivo.", "error");
        }
        UI.setLoading(false);
    },

    async deleteFile(id) {
        UI.setLoading(true, "Excluindo...");
        try {
            await GoogleAPI.deleteFile(id);
            UI.showToast("Projeto excluído!");
            await this.refreshDashboard();
        } catch (e) {
            console.error(e);
            UI.showToast("Erro ao excluir o arquivo.", "error");
        }
        UI.setLoading(false);
    },

    calcLucro() {
        const faturamentoEl = document.getElementById('campo_faturamento');
        const custosEl = document.getElementById('campo_custos');
        const lucroEl = document.getElementById('campo_lucro');

        if (!faturamentoEl || !custosEl || !lucroEl) return;

        const fat = parseFloat(faturamentoEl.value) || 0;
        const cust = parseFloat(custosEl.value) || 0;
        const luc = fat - cust;
        lucroEl.value = luc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    exportPDF() {
        const el = document.getElementById('content-area');
        if (!el) return;

        const projectName = document.getElementById('campo_nome')?.value || 'UNIARA';

        // Create a clone for PDF generation
        const clone = el.cloneNode(true);
        clone.style.padding = '40px';
        clone.style.background = 'white';

        // Add a Header to the PDF
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="text-align: center; border-bottom: 2px solid #1e3a5f; margin-bottom: 30px; padding-bottom: 10px; font-family: sans-serif;">
                <h1 style="color: #1e3a5f; margin: 0; font-size: 24px;">PLANO DE NEGÓCIOS</h1>
                <p style="color: #666; margin: 5px 0 0 0;">BP Generator - UNIARA</p>
                <h2 style="color: #333; margin: 15px 0 0 0;">${projectName}</h2>
            </div>
        `;
        clone.prepend(header);

        // Show all sections in the clone and style them for PDF
        const sections = clone.querySelectorAll('.form-section');
        sections.forEach(s => {
            s.style.display = 'block';
            s.style.marginBottom = '30px';
            s.style.pageBreakInside = 'avoid';
            s.style.boxShadow = 'none';
            s.style.border = 'none';

            // Remove guide boxes for cleaner PDF
            s.querySelectorAll('.guide-box').forEach(g => g.remove());

            // Replace inputs/textareas with styled text
            s.querySelectorAll('input, textarea').forEach(input => {
                const val = input.value || '(Não informado)';
                const labelText = input.previousElementSibling?.innerText || '';
                const p = document.createElement('div');
                p.style.marginBottom = '15px';
                p.style.fontFamily = 'sans-serif';
                p.innerHTML = `
                    <div style="font-weight: bold; color: #1e3a5f; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">${labelText}</div>
                    <div style="padding: 10px; border-left: 2px solid #ddd; background: #fafafa; white-space: pre-wrap; font-size: 14px;">${val}</div>
                `;
                input.parentNode.replaceChild(p, input);
            });
        });

        const opt = {
            margin: 15,
            filename: `Plano_Negocios_${projectName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        UI.setLoading(true, "Gerando PDF...");
        html2pdf().set(opt).from(clone).save().then(() => {
            UI.setLoading(false);
            UI.showToast("PDF Gerado com sucesso!");
        }).catch(err => {
            console.error(err);
            UI.setLoading(false);
            UI.showToast("Erro ao gerar PDF.", "error");
        });
    }
};

window.onload = () => App.init();
