const UI = {
    setLoading(show, msg = "Carregando...") {
        const el = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        if (show) {
            el.classList.remove('hidden');
            textEl.innerText = msg;
        } else {
            el.classList.add('hidden');
        }
    },

    showScreen(id) {
        ['loginScreen', 'dashboardScreen', 'purposeScreen', 'editorScreen'].forEach(s => {
            document.getElementById(s).classList.add('hidden');
        });
        document.getElementById(id).classList.remove('hidden');
    },

    renderFileList(files, onSelect, onDelete) {
        const list = document.getElementById('fileList');
        list.innerHTML = '';

        if (files.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-200 text-gray-400">Nenhum projeto encontrado. Clique em "Criar Novo Projeto" para começar.</div>';
            return;
        }

        files.forEach(f => {
            const name = f.name.replace('UNIARA_BP_', '').replace('.json', '');
            const date = new Date(f.modifiedTime).toLocaleDateString('pt-BR');

            const div = document.createElement('div');
            div.className = "bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between group relative";

            div.innerHTML = `
                <div>
                    <h3 class="font-bold text-gray-800 text-lg mb-1">${name}</h3>
                    <p class="text-xs text-gray-400">Última modificação: ${date}</p>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <button class="text-blue-600 font-semibold text-sm hover:underline">Abrir Projeto</button>
                    <button class="delete-btn opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;

            div.querySelector('.delete-btn').onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Tem certeza que deseja excluir o projeto "${name}"?`)) {
                    onDelete(f.id);
                }
            };

            div.onclick = () => onSelect(f.id);
            list.appendChild(div);
        });
    },

    updateUserDisplay(user) {
        document.getElementById('userDisplay').classList.remove('hidden');
        document.getElementById('userName').innerText = user.given_name;
    },

    openTab(tabId, btn) {
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    },

    setProjectTitle(title) {
        document.getElementById('projectTitle').innerText = title || 'Novo Plano';
    },

    fillFormData(data) {
        Object.keys(data).forEach(k => {
            const el = document.getElementById(k);
            if (el) el.value = data[k];
        });
    },

    getFormData() {
        const data = {};
        document.querySelectorAll('[id^="campo_"]').forEach(el => data[el.id] = el.value);
        return data;
    },

    clearForm() {
        document.querySelectorAll('input, textarea').forEach(el => el.value = '');
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold transition-all transform translate-y-20 z-[10000] ${
            type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`;
        toast.innerText = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.remove('translate-y-20'), 10);

        // Remove
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};
