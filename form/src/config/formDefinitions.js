/* ==========================================================================
   FORM DEFINITIONS & SCHEMA CONFIG (src/config/formDefinitions.js)
   ========================================================================== */

export const FORM_TYPES = {
    FEAM_2026: 'feam-2026',
    PROJE: 'proje-basvuru',
    KURUMSAL: 'kurumsal-iletisim'
};

export const BUILTIN_FORM_DEFINITIONS = {
    [FORM_TYPES.FEAM_2026]: {
        id: 'feam-2026',
        title: 'FEAM Networking 2026',
        category: 'Etkinlik & Buluşma',
        banner: '/asset/feam_banner.png',
        meta: [
            { icon: 'fa-calendar-day', text: '1 Ağustos 2026, 15:00' },
            { icon: 'fa-location-dot', text: 'Atölye Üsküdar' },
            { icon: 'fa-rocket', text: 'Firnas TEAM Buluşması' }
        ],
        description: 'Lise ve üniversite öğrencilerinin teknoloji ve inovasyon etrafında bir araya geldiği; proje sunumları, tanışma etkinliği, networking çalışmaları ve ortak üretim odaklı fikir alışverişi yapılan bu özel buluşmada yerinizi almak için aşağıdaki formu eksiksiz doldurun!',
        steps: [
            {
                id: 'personal',
                title: 'Kişisel Bilgiler',
                icon: 'fa-user',
                desc: 'İletişim ve yaka kartı doğrulama bilgilendirmeleri için gereklidir.',
                fields: [
                    { id: 'fullName', label: 'İsim Soyisim', type: 'text', required: true, icon: 'fa-user', placeholder: 'Ad Soyad giriniz' },
                    { id: 'phone', label: 'Telefon Numarası', type: 'tel', required: true, icon: 'fa-phone', placeholder: 'Örn: 0555 123 45 67', validate: 'phone' },
                    { id: 'email', label: 'E-posta Adresi', type: 'email', required: true, icon: 'fa-envelope', placeholder: 'ornek@domain.com', validate: 'email' },
                    { id: 'district', label: 'İkamet Edilen İlçe', type: 'text', required: true, icon: 'fa-map-pin', placeholder: 'Örn: Üsküdar / Kadıköy' }
                ]
            },
            {
                id: 'education',
                title: 'Eğitim Bilgileri',
                icon: 'fa-graduation-cap',
                desc: 'Networking gruplaması ve akademik profil belirleme için istenmektedir.',
                fields: [
                    { id: 'university', label: 'Üniversite / Okul', type: 'text', required: true, icon: 'fa-building-columns', placeholder: 'Örn: İTÜ / Yıldız Teknik / Lise' },
                    { id: 'department', label: 'Bölüm', type: 'text', required: true, icon: 'fa-microchip', placeholder: 'Örn: Bilgisayar Mühendisliği' },
                    { 
                        id: 'grade', 
                        label: 'Sınıf', 
                        type: 'select', 
                        required: true, 
                        icon: 'fa-layer-group', 
                        options: ['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 'Yüksek Lisans', 'Mezun'] 
                    }
                ]
            },
            {
                id: 'details',
                title: 'Detaylar & KVKK',
                icon: 'fa-bullhorn',
                desc: 'Son birkaç detay soru ile kaydınızı tamamlayın.',
                fields: [
                    { 
                        id: 'hearAbout', 
                        label: 'Etkinliği Nereden Duydunuz?', 
                        type: 'radio_cards', 
                        required: true,
                        options: [
                            { value: 'Instagram', icon: 'fab fa-instagram' },
                            { value: 'LinkedIn', icon: 'fab fa-linkedin' },
                            { value: 'Arkadaş Tavsiyesi', icon: 'fas fa-user-group' },
                            { value: 'WhatsApp Grupları', icon: 'fab fa-whatsapp' }
                        ]
                    },
                    { id: 'notes', label: 'Eklemek İstedikleriniz (İsteğe bağlı)', type: 'textarea', required: false, placeholder: 'Geliştiricilere iletmek istediğiniz not...' },
                    { id: 'kvkk', label: 'KVKK Onayı', type: 'kvkk_checkbox', required: true }
                ]
            }
        ]
    },
    [FORM_TYPES.PROJE]: {
        id: 'proje-basvuru',
        title: 'Firnas Proje & AR-GE Başvurusu',
        category: 'Proje & AR-GE',
        banner: null,
        meta: [
            { icon: 'fa-microchip', text: 'AR-GE & Otonom Sistemler' },
            { icon: 'fa-laptop-code', text: 'Yazılım, Donanım & STEM' },
            { icon: 'fa-bolt', text: 'Proje Başvuruları Açık' }
        ],
        description: 'Firnas Technologies bünyesinde yürütülen teknoloji, yazılım, robotik ve STEM projelerinde yer almak, kendi projenizle başvuru yapmak veya geliştirme ekibimize dahil olmak için aşağıdaki başvuru formunu doldurun.',
        steps: [
            {
                id: 'personal',
                title: 'Kişisel İletişim',
                icon: 'fa-user',
                desc: 'Başvuru değerlendirme süreciniz için gereklidir.',
                fields: [
                    { id: 'fullName', label: 'İsim Soyisim', type: 'text', required: true, icon: 'fa-user', placeholder: 'Ad Soyad giriniz' },
                    { id: 'phone', label: 'Telefon Numarası', type: 'tel', required: true, icon: 'fa-phone', placeholder: '0555 123 45 67', validate: 'phone' },
                    { id: 'email', label: 'E-posta Adresi', type: 'email', required: true, icon: 'fa-envelope', placeholder: 'ornek@domain.com', validate: 'email' },
                    { id: 'district', label: 'İlçe', type: 'text', required: true, icon: 'fa-map-pin', placeholder: 'İlçe giriniz' }
                ]
            },
            {
                id: 'skills',
                title: 'Teknik Profil & Okul',
                icon: 'fa-laptop-code',
                desc: 'Yazılım ve donanım tecrübenizi belirtin.',
                fields: [
                    { id: 'university', label: 'Üniversite / Okul', type: 'text', required: true, icon: 'fa-building-columns', placeholder: 'Okulunuz' },
                    { id: 'department', label: 'Bölüm', type: 'text', required: true, icon: 'fa-microchip', placeholder: 'Bölümünüz' },
                    { id: 'grade', label: 'Sınıf', type: 'select', required: true, icon: 'fa-layer-group', options: ['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 'Yüksek Lisans', 'Mezun'] }
                ]
            },
            {
                id: 'details',
                title: 'Proje Fikri & KVKK',
                icon: 'fa-lightbulb',
                desc: 'Başvuru yapmak istediğiniz alan ve onaylar.',
                fields: [
                    { 
                        id: 'hearAbout', 
                        label: 'İlgi Alanınız', 
                        type: 'radio_cards', 
                        required: true,
                        options: [
                            { value: 'Yazılım', icon: 'fas fa-code' },
                            { value: 'Otonom Sistemler', icon: 'fas fa-robot' },
                            { value: 'STEM & Eğitim', icon: 'fas fa-brain' },
                            { value: 'Donanım & İHA', icon: 'fas fa-plane-up' }
                        ]
                    },
                    { id: 'notes', label: 'Proje Detayınız veya Ek İletmek İstedikleriniz', type: 'textarea', required: false, placeholder: 'Projenizi kısaca özetleyin...' },
                    { id: 'kvkk', label: 'KVKK Onayı', type: 'kvkk_checkbox', required: true }
                ]
            }
        ]
    },
    [FORM_TYPES.KURUMSAL]: {
        id: 'kurumsal-iletisim',
        title: 'Kurumsal İletişim & Destek Formu',
        category: 'İletişim & Destek',
        banner: null,
        meta: [
            { icon: 'fa-headset', text: '7/24 İletişim Merkezi' },
            { icon: 'fa-building', text: 'Firnas Technologies HQ' },
            { icon: 'fa-envelope-open-text', text: 'Kurumsal Talepler' }
        ],
        description: 'Firnas Technologies ürünleri, eğitim kitlerimiz (FiCo) veya kurumsal iş birliği talepleriniz için doğrudan yönetim ve destek ekibimize mesajınızı iletebilirsiniz.',
        steps: [
            {
                id: 'personal',
                title: 'İletişim Bilgileri',
                icon: 'fa-user',
                desc: 'Geri dönüş yapabilmemiz için gereklidir.',
                fields: [
                    { id: 'fullName', label: 'İsim Soyisim', type: 'text', required: true, icon: 'fa-user', placeholder: 'Ad Soyad giriniz' },
                    { id: 'phone', label: 'Telefon Numarası', type: 'tel', required: true, icon: 'fa-phone', placeholder: '0555 123 45 67', validate: 'phone' },
                    { id: 'email', label: 'E-posta Adresi', type: 'email', required: true, icon: 'fa-envelope', placeholder: 'ornek@domain.com', validate: 'email' },
                    { id: 'district', label: 'İlçe / Kurum', type: 'text', required: true, icon: 'fa-building', placeholder: 'Kurum veya İlçe' }
                ]
            },
            {
                id: 'topic',
                title: 'Konu & Mesaj',
                icon: 'fa-headset',
                desc: 'Talebinizi detaylandırın.',
                fields: [
                    { id: 'university', label: 'Kurum / Okul Adı', type: 'text', required: false, icon: 'fa-building-columns', placeholder: 'İsteğe bağlı' },
                    { id: 'department', label: 'Göreviniz / Unvan', type: 'text', required: false, icon: 'fa-user-tie', placeholder: 'Örn: Öğretmen / Kurucu' },
                    { id: 'grade', label: 'Destek Türü', type: 'select', required: true, icon: 'fa-list', options: ['FiCo Eğitim Kiti', 'Sponsorluk & İş Birliği', 'Teknik Destek', 'Diğer'] }
                ]
            },
            {
                id: 'details',
                title: 'Mesajınız & KVKK',
                icon: 'fa-envelope',
                desc: 'Talep notunuzu girin.',
                fields: [
                    { 
                        id: 'hearAbout', 
                        label: 'İletişim Sebebi', 
                        type: 'radio_cards', 
                        required: true,
                        options: [
                            { value: 'Ürün Bilgisi', icon: 'fas fa-box' },
                            { value: 'Kurumsal Görüşme', icon: 'fas fa-handshake' },
                            { value: 'Öğrenci Kulüpleri', icon: 'fas fa-users' },
                            { value: 'Genel', icon: 'fas fa-envelope' }
                        ]
                    },
                    { id: 'notes', label: 'Mesaj Detayınız', type: 'textarea', required: true, placeholder: 'Detaylı açıklamanızı buraya yazın...' },
                    { id: 'kvkk', label: 'KVKK Onayı', type: 'kvkk_checkbox', required: true }
                ]
            }
        ]
    }
};
