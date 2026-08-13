const snapUrl =
  import.meta.env.VITE_MIDTRANS_SNAP_URL ||
  'https://app.sandbox.midtrans.com/snap/snap.js';
const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

let loadPromise: Promise<MidtransSnap> | null = null;

export function loadMidtransSnap(): Promise<MidtransSnap> {
  if (window.snap) return Promise.resolve(window.snap);
  if (!clientKey) {
    return Promise.reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum dikonfigurasi'));
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<MidtransSnap>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = snapUrl;
    script.async = true;
    script.dataset.koskuMidtransSnap = 'true';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => {
      if (window.snap) {
        resolve(window.snap);
      } else {
        reject(new Error('Snap.js termuat tetapi objek Snap tidak tersedia'));
      }
    };
    script.onerror = () => reject(new Error('Gagal memuat Snap.js'));
    document.head.appendChild(script);
  }).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}
