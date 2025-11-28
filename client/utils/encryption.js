export const encryptId = (id) => {
    if (!id) return '';
    try {
        return btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        console.error('Encryption failed', e);
        return id;
    }
};

export const decryptId = (encodedId) => {
    if (!encodedId) return '';
    try {
        let str = encodedId.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return atob(str);
    } catch (e) {
        console.error('Decryption failed', e);
        return encodedId;
    }
};
