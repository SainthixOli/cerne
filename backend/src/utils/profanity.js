const PROHIBITED_WORDS = [
    // --- Variações de "Merda" / "Bosta" ---
    'merda', 'merdinha', 'bosta', 'bostinha', 'caguei', 'cagar', 'fezes',

    // --- Variações de Órgãos Genitais (Masculino) ---
    'pau', 'pinto', 'piroc', 'piroca', 'caralho', 'caralha', 'cacete', 'kct', 'k7',
    'rola', 'rolha', 'penis', 'pênis', 'saco', 'testiculo', 'testículo',
    'verga', 'membro', 'jeba', 'geba',

    // --- Variações de Órgãos Genitais (Feminino) ---
    'buceta', 'bct', 'xereca', 'xota', 'xoxota', 'perereca', 'vagina', 'clitoris', 'clitóris',
    'grelo', 'vulva', 'tabaca', 'racha',

    // --- Variações de Retaguarda ---
    'cu', 'cv', 'cú', 'anus', 'ânus', 'bunda', 'rabao', 'rabão', 'rabo', 'traseiro', 'anal',

    // --- Insultos Gerais / Morais ---
    'puta', 'puto', 'prostituta', 'vagabunda', 'vagabundo', 'piranha', 'vadia', 'cachorra', 'cadela',
    'arrombado', 'arrombada', 'otario', 'otário', 'trouxa', 'babaca', 'idiota', 'imbecil', 'retardado', 'retardada',
    'burro', 'burra', 'anta', 'besta', 'animal', 'jegue', 'inutil', 'inútil',
    'desgraca', 'desgraça', 'maldito', 'maldita', 'lixo', 'escroto', 'escrota',

    // --- Termos homofóbicos / Preconceituosos ---
    'viado', 'viadinho', 'bicha', 'bichinha', 'gay', 'guei', 'lesbica', 'lésbica', 'sapatao', 'sapatão',
    'traveco', 'travesti', 'trans', 'boiola', 'marica',

    // --- Atos Sexuais / "Fulsexual" ---
    'sexo', 'transar', 'foder', 'fuder', 'fodido', 'fudido', 'foda', 'trepar', 'comer',
    'boquete', 'queter', 'chupar', 'chupa', 'mamada', 'mamar',
    'siririca', 'punheta', 'gozar', 'gozo', 'esporra', 'esporrar', 'orgasmo', 'ejacular', 'ejaculação',
    'penetracao', 'penetração', 'anal', 'oral', '69',

    // --- Termos Críticos / Ilegais ---
    'estupro', 'estuprar', 'pedofilia', 'pedofilo', 'pedófilo', 'abuso', 'assedio', 'assédio',
    'incesto', 'nudes', 'pelado', 'pelada', 'nu', 'nua', 'pornografia', 'porno', 'pornô', 'xxx',

    // --- Siglas e Abreviações Ofensivas ---
    'fdp', 'pqp', 'vtc', 'vsf', 'tnc', 'tmjnc', 'chupapau', 'chupacu'
];

// Função auxiliar para normalizar texto (remover acentos)
const normalizeText = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

exports.hasProfanity = (text) => {
    if (!text) return false;

    // 1. Normaliza o texto de entrada (remove acentos, caixa baixa)
    const normalizedInput = normalizeText(text);

    return PROHIBITED_WORDS.some(word => {
        // 2. Normaliza também a palavra proibida (embora a lista já possa estar sem acentos, é garantido)
        const normalizedWord = normalizeText(word);

        // 3. Verifica se a palavra proibida está contida no texto
        // Nota: Isso bloqueia "computador" se "puta" estiver na lista e a lógica for muito simples.
        // O array acima tenta ser específico.
        // Para evitar falsos positivos excessivos (como 'computador' contendo 'puta'), 
        // podemos verificar bordas de palavras, mas 'bosta' pode estar em 'superbosta'.

        // Estratégia Híbrida:
        // Palavras curtas (< 4 letras) exigem match exato ou delimitadores?
        // 'cu' pega 'curto', 'curso', 'cubo'. Isso é UM PROBLEMA com .includes().

        if (normalizedWord.length <= 3) {
            // Para palavras curtas, usar regex para garantir que é uma palavra isolada
            // ou está no início/fim ou cercada de espaços/pontuação
            const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
            return regex.test(normalizedInput);
        } else {
            // Para palavras maiores, pode ser parte, mas cuidado com falsos positivos comuns.
            // "computador" tem "puta".
            // Vamos usar regex boundary para quase tudo para ser seguro, exceto raízes claras?
            // O usuário pediu "uita palavra", então ele quer rigor.
            // Mas 'computador' ser bloqueado irrita.

            // Vamos bloquear apenas palavras INTEIRAS ou Variações claras.
            // 'includes' é muito agressivo para 'cu' e 'puta'.
            // Vou usar Word Boundary para tudo, exceto se eu souber que é prefixo.

            // ATUALIZAÇÃO: O usuário reclamou que "ta aceitando muita palavra".
            // Talvez ele queira que 'superbosta' seja bloqueado.
            // Se eu usar boundary, 'superbosta' passa.

            // Compromisso:
            // Palavras muito curtas e comuns em outras palavras (cu, puta) -> Boundary.
            // Palavras longas ou muito específicas (arrombado, buceta) -> Includes.

            const dangerousShortWords = ['cu', 'pis', 'pau', 'puta', 'puto', 'bisha', 'gay'];

            if (dangerousShortWords.includes(normalizedWord)) {
                const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
                return regex.test(normalizedInput);
            }

            return normalizedInput.includes(normalizedWord);
        }
    });
};
