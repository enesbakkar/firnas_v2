import re
import json

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Update script.js
script_content = read_file('script.js')

# The translation data
new_translations = """const translations = {
    "tr": {
        "nav_home": "Ana Sayfa",
        "nav_about": "Hakkımızda",
        "nav_projects": "Projelerimiz",
        "nav_contact": "İletişim",
        "hero_badge": "Yazılım & Havacılık",
        "hero_title": "Geleceği Kodluyor,<br>Sınırları Aşıyoruz.",
        "hero_subtitle": "Firnas Technologies olarak, kurumsal çözümlerimizle yazılım, yapay zeka ve otonom havacılık sistemlerinde yenilikçi teknolojiler üretiyoruz.",
        "hero_btn_projects": "Projelerimizi İnceleyin",
        "hero_btn_about": "Kurumsal",
        "focus_title": "FiCo: Eğitimde STEM Devrimi",
        "focus_desc": "Sıradan bir drone değil; tamamen yerli donanım, açık kaynak geliştirme altyapısı ve yapay zeka entegrasyonu ile donatılmış programlanabilir bir öğrenme ekosistemi.",
        "focus_sub_title": "Gelişmiş Öğrenme Ekosistemi",
        "focus_sub_desc": "FiCo (Firnas Copter), öğrencilerin STEM becerilerini uluslararası standartlarda geliştirmeleri için kurumsal mühendislik prensipleriyle tasarlanmıştır.",
        "feature_1": "<strong>Profesyonel Kodlama:</strong> Hem blok tabanlı hem de ileri seviye yazılım dilleriyle uyumlu altyapı.",
        "feature_2": "<strong>Yapay Zeka Modülleri:</strong> Görüntü işleme ve otonom karar alma yetenekleri.",
        "feature_3": "<strong>Kurumsal Destek:</strong> Kurumlar ve okullar için özel eğitim müfredatı.",
        "services_title": "Hizmetlerimiz ve <span class='text-accent'>Çözümlerimiz</span>",
        "services_desc": "Güçlü yazılım altyapımızla geliştirdiğimiz ileri teknoloji alanları.",
        "srv_1_title": "Otonom Sistemler",
        "srv_1_desc": "İnsansız araçlar için yüksek hassasiyetli rota planlama ve otonom karar alma yazılımları geliştiriyoruz.",
        "srv_2_title": "Görüntü İşleme",
        "srv_2_desc": "Endüstriyel ve askeri standartlarda, gerçek zamanlı yapay zeka tabanlı nesne tanıma ve takip sistemleri.",
        "srv_3_title": "Eğitim Teknolojileri",
        "srv_3_desc": "Kurumların ihtiyaçlarına yönelik özelleştirilebilir, yenilikçi eğitim platformları ve simülasyonlar.",
        "footer_desc": "İnsani ve yenilikçi vizyonuyla, kurumsal yazılım ve havacılık çözümleri üreten teknoloji merkezi.",
        "footer_corp": "Kurumsal",
        "footer_contact": "İletişim",
        "footer_rights": "© 2026 Firnas Technologies. Tüm hakları saklıdır.",
        
        "about_header_title": "Kurumsal <span class='text-accent'>Kimliğimiz</span>",
        "about_header_desc": "Geçmişin ilhamıyla geleceğin yazılım ve havacılık teknolojilerini inşa eden teknoloji merkezi.",
        "about_content_title": "İlhamımızı Gökyüzünden,<br>Gücümüzü <span class='text-accent'>Yazılımdan</span> Alıyoruz",
        "about_content_p1": "Adımız, tarihteki ilk planör uçuşunu gerçekleştiren büyük mucit <strong>Abbas Kasım İbn Firnas</strong>'tan gelmektedir. Onun cesareti ve bilime olan tutkusu, kurumsal vizyonumuzun temelini oluşturuyor.",
        "about_content_p2": "Firnas Technologies olarak, sadece bir donanım sağlayıcısı değil; aynı zamanda donanımları zeki kılan algoritmaları ve sistemleri üreten profesyonel bir <strong>yazılım ve teknoloji şirketiyiz</strong>. Amacımız, ülkemizin bağımsız teknoloji hedeflerine katkıda bulunmaktır.",
        "about_team_title": "Yönetim ve <span class='text-accent'>Mühendislik Ekibi</span>",
        "about_team_desc": "Başarılarımızın arkasındaki uzman kadromuz.",
        "team_1_role": "Kurucu",
        "team_2_role": "Elektronik Birim Sorumlusu",
        "team_3_name": "Yazılım Ekibi",
        "team_3_role": "Sistem ve Otonomi Geliştirme",
        
        "projects_header_title": "Ürünler ve <span class='text-accent'>Projeler</span>",
        "projects_header_desc": "Yerli kaynaklarla geliştirdiğimiz, profesyonel havacılık ve yazılım çözümlerimiz.",
        "proj_1_badge": "Eğitim Teknolojileri",
        "proj_1_desc": "FiCo, kurumların ve okulların mühendislik eğitimlerinde kullanabileceği, donanımı ve yazılımı tamamen yerli olan profesyonel eğitim dronudur.",
        "proj_1_f1": "Yerli Uçuş Kontrol Sistemleri",
        "proj_1_f2": "Açık Kaynak Geliştirme Platformu",
        "proj_1_f3": "Kurumsal AR-GE ve Yapay Zeka Desteği",
        "proj_2_desc": "Savunma sanayisi standartlarına uygun olarak tasarlanan ÜSKA, otonom yapay zeka sistemleriyle donatılmış profesyonel bir İnsansız Hava Aracıdır.",
        "proj_2_f1": "Endüstriyel Veri Analizi",
        "proj_2_f2": "Gerçek Zamanlı Görüntü İşleme",
        "proj_2_f3": "Yüksek Otonomi Algoritmaları",
        "proj_3_desc": "Güvenlik ihtiyaçlarına yönelik olarak geliştirilen MUHAFIZ, yapay zeka güdümlü hassas bir takip ve savunma sistemi konseptidir.",
        "proj_3_f1": "Gelişmiş Sensör Füzyonu",
        "proj_3_f2": "Otonom Karar Alma Yeteneği",
        "proj_3_f3": "Kriptolu Veri İletişimi",
        
        "contact_header_title": "Kurumsal <span class='text-accent'>İletişim</span>",
        "contact_header_desc": "Projelerimiz ve kurumsal hizmetlerimiz hakkında detaylı bilgi almak için bizimle iletişime geçin.",
        "contact_info_title": "İletişim Bilgileri",
        "contact_email_title": "E-Posta",
        "contact_phone_title": "Telefon / Müşteri Hizmetleri",
        "contact_address_title": "Merkez Ofis",
        "contact_address_val": "İstanbul, Türkiye",
        "contact_form_title": "Mesaj Gönderin",
        "contact_label_name": "Ad Soyad / Kurum Adı",
        "contact_label_email": "Kurumsal E-Posta",
        "contact_label_subject": "Konu Seçimi",
        "contact_opt_1": "Ürün Bilgisi (FiCo)",
        "contact_opt_2": "Kurumsal İşbirliği",
        "contact_opt_3": "Teknik Destek",
        "contact_opt_4": "Diğer",
        "contact_label_msg": "Detaylı Mesajınız",
        "contact_btn_send": "Talebi İlet",
        "hero_prefix": "Firnas Teknoloji;",
        "hero_sub_prefix": "Yarının ",
        "hero_typewriter_1": "Teknolojisi",
        "hero_typewriter_2": "Hayalleri",
        "hero_typewriter_3": "Macerası",
        "hero_btn_explore": "Ekosistemi Keşfet",
        "fico_preorder": "Ön Sipariş Ver",
        "fico_hs_1_title": "Sensör Fizyonu",
        "fico_hs_1_desc": "Yerleşik ultrasonik, kızılötesi ve optik akış sensörleri ile kapalı alanlarda ve GPS olmayan laboratuvarlarda milimetrik uçuş sabitleme sağlar.",
        "fico_hs_2_title": "Karbon-Fiber Gövde",
        "fico_hs_2_desc": "Çarpmalara karşı %100 dayanıklı, ultra hafif ve modüler karbon-fiber kafes gövdesi ile sınıf ortamında tamamen güvenli eğitim uçuşları sunar.",
        "fico_hs_3_title": "Yapay Zeka İşlemci",
        "fico_hs_3_desc": "Üzerindeki yardımcı işlemci kartı sayesinde Python tabanlı görüntü işleme, gerçeğe yakın nesne tespiti ve makine öğrenimi modellerini havada çalıştırır.",
        "fico_hs_4_title": "Gelişmiş Otonom Kart",
        "fico_hs_4_desc": "Özgün mühendislikle geliştirilen stabilite algoritmaları ve çift işlemcili uçuş kontrolörü sayesinde üstün havada asili kalma (hover) kararlılığı sunar.",
        "contact_title": "İletişim",
        "contact_socials": "Sosyal Medya",
        "contact_locations_title": "Lokasyonlarımız",
        "location_live": "Canlı",
        "location_office_title": "Merkez Ofis",
        "location_office_coords": "41.0343° N, 28.7909° E",
        "location_workshop_title": "Üretim Atölyesi",
        "location_workshop_coords": "41.0267° N, 29.0142° E",
        "location_expand_hint": "Genişletmek için tıklayın"
    },
    "en": {
        "nav_home": "Home",
        "nav_about": "About Us",
        "nav_projects": "Projects",
        "nav_contact": "Contact",
        "hero_badge": "Software & Aviation",
        "hero_title": "Coding the Future,<br>Crossing Boundaries.",
        "hero_subtitle": "As Firnas Technologies, we produce innovative technologies in software, artificial intelligence and autonomous aviation systems with our corporate solutions.",
        "hero_btn_projects": "Explore Projects",
        "hero_btn_about": "Corporate",
        "focus_title": "FiCo: STEM Revolution in Education",
        "focus_desc": "Not just an ordinary drone; a programmable learning ecosystem equipped with entirely local hardware, open-source development infrastructure, and artificial intelligence integration.",
        "focus_sub_title": "Advanced Learning Ecosystem",
        "focus_sub_desc": "FiCo (Firnas Copter) is designed with corporate engineering principles for students to develop their STEM skills at international standards.",
        "feature_1": "<strong>Professional Coding:</strong> Infrastructure compatible with both block-based and advanced software languages.",
        "feature_2": "<strong>AI Modules:</strong> Image processing and autonomous decision-making capabilities.",
        "feature_3": "<strong>Corporate Support:</strong> Special education curriculum for institutions and schools.",
        "services_title": "Services and <span class='text-accent'>Solutions</span>",
        "services_desc": "Advanced technology areas we developed with our strong software infrastructure.",
        "srv_1_title": "Autonomous Systems",
        "srv_1_desc": "We develop high-precision route planning and autonomous decision-making software for unmanned vehicles.",
        "srv_2_title": "Image Processing",
        "srv_2_desc": "Real-time AI-based object recognition and tracking systems in industrial and military standards.",
        "srv_3_title": "Educational Tech",
        "srv_3_desc": "Customizable, innovative educational platforms and simulations tailored to corporate needs.",
        "footer_desc": "A technology center producing corporate software and aviation solutions with a global and humanitarian vision.",
        "footer_corp": "Corporate",
        "footer_contact": "Contact",
        "footer_rights": "© 2026 Firnas Technologies. All rights reserved.",
        
        "about_header_title": "Corporate <span class='text-accent'>Identity</span>",
        "about_header_desc": "A technology center building future software and aviation technologies inspired by the past.",
        "about_content_title": "Inspired by the Sky,<br>Empowered by <span class='text-accent'>Software</span>",
        "about_content_p1": "Our name comes from the great inventor <strong>Abbas Qasim Ibn Firnas</strong>, who performed the first glider flight in history. His courage and passion for science form the foundation of our corporate vision.",
        "about_content_p2": "As Firnas Technologies, we are not just a hardware provider; we are a professional <strong>software and technology company</strong> that produces the algorithms and systems that make hardware smart. Our goal is to contribute to our country's independent technology targets.",
        "about_team_title": "Management and <span class='text-accent'>Engineering Team</span>",
        "about_team_desc": "The expert staff behind our success.",
        "team_1_role": "Founder",
        "team_2_role": "Electronic Unit Manager",
        "team_3_name": "Software Team",
        "team_3_role": "System and Autonomy Development",
        
        "projects_header_title": "Products and <span class='text-accent'>Projects</span>",
        "projects_header_desc": "Professional aviation and software solutions developed with local resources.",
        "proj_1_badge": "Educational Technologies",
        "proj_1_desc": "FiCo is a professional educational drone with entirely local hardware and software, designed for institutional and school engineering education.",
        "proj_1_f1": "Local Flight Control Systems",
        "proj_1_f2": "Open Source Development Platform",
        "proj_1_f3": "Corporate R&D and AI Support",
        "proj_2_desc": "Designed in accordance with defense industry standards, ÜSKA is a professional Unmanned Aerial Vehicle equipped with autonomous AI systems.",
        "proj_2_f1": "Industrial Data Analysis",
        "proj_2_f2": "Real-Time Image Processing",
        "proj_2_f3": "High Autonomy Algorithms",
        "proj_3_desc": "Developed for security needs, MUHAFIZ is an AI-guided precision tracking and defense system concept.",
        "proj_3_f1": "Advanced Sensor Fusion",
        "proj_3_f2": "Autonomous Decision Making",
        "proj_3_f3": "Encrypted Data Communication",
        
        "contact_header_title": "Corporate <span class='text-accent'>Contact</span>",
        "contact_header_desc": "Contact us to get detailed information about our projects and corporate services.",
        "contact_info_title": "Contact Information",
        "contact_email_title": "E-Mail",
        "contact_phone_title": "Phone / Customer Service",
        "contact_address_title": "Head Office",
        "contact_address_val": "Istanbul, Turkey",
        "contact_form_title": "Send a Message",
        "contact_label_name": "Name Surname / Company Name",
        "contact_label_email": "Corporate E-Mail",
        "contact_label_subject": "Select Subject",
        "contact_opt_1": "Product Information (FiCo)",
        "contact_opt_2": "Corporate Collaboration",
        "contact_opt_3": "Technical Support",
        "contact_opt_4": "Other",
        "contact_label_msg": "Detailed Message",
        "contact_btn_send": "Submit Request",
        "hero_prefix": "Firnas Technologies;",
        "hero_sub_prefix": "",
        "hero_typewriter_1": "Technology of Tomorrow",
        "hero_typewriter_2": "Dreams of Tomorrow",
        "hero_typewriter_3": "Adventure of Tomorrow",
        "hero_btn_explore": "Explore Ecosystem",
        "fico_preorder": "Pre-Order Now",
        "fico_hs_1_title": "Sensor Fusion",
        "fico_hs_1_desc": "Integrated ultrasonic, infrared and optical flow sensors provide millimeter-level flight stabilization in indoor spaces and GPS-free laboratories.",
        "fico_hs_2_title": "Carbon-Fiber Frame",
        "fico_hs_2_desc": "Crash-resistant cage frame structure is modular, extremely lightweight, and ensures entirely safe educational flights in classrooms.",
        "fico_hs_3_title": "AI Auxiliary Processor",
        "fico_hs_3_desc": "Features an on-board coprocessor card that runs Python-based image processing, real-time object detection, and machine learning models in mid-air.",
        "fico_hs_4_title": "Advanced Autonomous Board",
        "fico_hs_4_desc": "Delivers superior hover stability thanks to dual processors and proprietary stability control flight algorithms built on high engineering standards.",
        "contact_title": "Contact",
        "contact_socials": "Social Media",
        "contact_locations_title": "Our Locations",
        "location_live": "Live",
        "location_office_title": "Headquarters",
        "location_office_coords": "41.0343° N, 28.7909° E",
        "location_workshop_title": "Production Workshop",
        "location_workshop_coords": "41.0267° N, 29.0142° E",
        "location_expand_hint": "Click to expand"
    },
    "ar": {
        "nav_home": "الرئيسية",
        "nav_about": "معلومات عنا",
        "nav_projects": "مشاريعنا",
        "nav_contact": "اتصل بنا",
        "hero_badge": "البرمجيات والطيران",
        "hero_title": "نبرمج المستقبل،<br>ونتجاوز الحدود.",
        "hero_subtitle": "بصفتنا Firnas Technologies، ننتج تقنيات مبتكرة في البرمجيات والذكاء الاصطناعي وأنظمة الطيران المستقلة مع حلولنا المؤسسية.",
        "hero_btn_projects": "اكتشف المشاريع",
        "hero_btn_about": "مؤسسي",
        "focus_title": "FiCo: ثورة STEM في التعليم",
        "focus_desc": "ليس مجرد طائرة بدون طيار عادية؛ بل هو نظام بيئي تعليمي قابل للبرمجة مجهز بأجهزة محلية بالكامل وبنية تحتية للتطوير مفتوحة المصدر وتكامل الذكاء الاصطناعي.",
        "focus_sub_title": "نظام بيئي تعليمي متقدم",
        "focus_sub_desc": "تم تصميم FiCo (Firnas Copter) بمبادئ هندسية مؤسسية للطلاب لتطوير مهاراتهم في مجالات العلوم والتكنولوجيا والهندسة والرياضيات وفقًا للمعايير الدولية.",
        "feature_1": "<strong>برمجة احترافية:</strong> بنية تحتية متوافقة مع كل من اللغات القائمة على الكتل ولغات البرمجيات المتقدمة.",
        "feature_2": "<strong>وحدات الذكاء الاصطناعي:</strong> معالجة الصور وقدرات اتخاذ القرار المستقلة.",
        "feature_3": "<strong>دعم مؤسسي:</strong> منهج تعليمي خاص للمؤسسات والمدارس.",
        "services_title": "خدماتنا و <span class='text-accent'>حلولنا</span>",
        "services_desc": "مجالات التكنولوجيا المتقدمة التي طورناها ببنيتنا التحتية القوية للبرمجيات.",
        "srv_1_title": "الأنظمة المستقلة",
        "srv_1_desc": "نقوم بتطوير تخطيط مسار عالي الدقة وبرامج اتخاذ قرار مستقلة للمركبات غير المأهولة.",
        "srv_2_title": "معالجة الصور",
        "srv_2_desc": "أنظمة التعرف على الأشياء وتتبعها بالذكاء الاصطناعي في الوقت الفعلي بالمعايير الصناعية والعسكرية.",
        "srv_3_title": "تكنولوجيا التعليم",
        "srv_3_desc": "منصات تعليمية ومحاكاة مبتكرة وقابلة للتخصيص مصممة لاحتياجات الشركات.",
        "footer_desc": "مركز تكنولوجي ينتج برمجيات مؤسسية وحلول طيران برؤية تكنولوجية وطنية.",
        "footer_corp": "مؤسسي",
        "footer_contact": "اتصل بنا",
        "footer_rights": "© 2026 Firnas Technologies. كل الحقوق محفوظة.",
        
        "about_header_title": "هويتنا <span class='text-accent'>المؤسسية</span>",
        "about_header_desc": "مركز تكنولوجي يبني تقنيات برمجيات وطيران مستقبلية مستوحاة من الماضي.",
        "about_content_title": "إلهامنا من السماء،<br>وقوتنا من <span class='text-accent'>البرمجيات</span>",
        "about_content_p1": "يأتي اسمنا من المخترع العظيم <strong>عباس بن فرناس</strong>، الذي قام بأول رحلة طيران شراعي في التاريخ. شجاعته وشغفه بالعلم يشكلان أساس رؤيتنا المؤسسية.",
        "about_content_p2": "بصفتنا Firnas Technologies، لسنا مجرد مزود للأجهزة؛ بل نحن <strong>شركة برمجيات وتكنولوجيا</strong> محترفة تنتج الخوارزميات والأنظمة التي تجعل الأجهزة ذكية. هدفنا هو المساهمة في أهداف التكنولوجيا المستقلة لبلدنا.",
        "about_team_title": "فريق الإدارة و <span class='text-accent'>الهندسة</span>",
        "about_team_desc": "الموظفون الخبراء وراء نجاحنا.",
        "team_1_role": "مؤسس",
        "team_2_role": "مدير الوحدة الإلكترونية",
        "team_3_name": "فريق البرمجيات",
        "team_3_role": "تطوير النظام والاستقلالية",
        
        "projects_header_title": "المنتجات و <span class='text-accent'>المشاريع</span>",
        "projects_header_desc": "حلول طيران وبرمجيات احترافية تم تطويرها بموارد محلية.",
        "proj_1_badge": "تقنيات التعليم",
        "proj_1_desc": "FiCo هي طائرة بدون طيار تعليمية احترافية بأجهزة وبرامج محلية بالكامل، مصممة للتعليم الهندسي المؤسسي والمدرسي.",
        "proj_1_f1": "أنظمة التحكم في الطيران المحلية",
        "proj_1_f2": "منصة تطوير مفتوحة المصدر",
        "proj_1_f3": "دعم البحث والتطوير المؤسسي والذكاء الاصطناعي",
        "proj_2_desc": "تم تصميم ÜSKA وفقًا لمعايير صناعة الدفاع، وهي طائرة بدون طيار احترافية مزودة بأنظمة ذكاء اصطناعي مستقلة.",
        "proj_2_f1": "تحليل البيانات الصناعية",
        "proj_2_f2": "معالجة الصور في الوقت الفعلي",
        "proj_2_f3": "خوارزميات استقلالية عالية",
        "proj_3_desc": "تم تطوير MUHAFIZ لتلبية الاحتياجات الأمنية، وهو مفهوم نظام تتبع ودفاع دقيق موجه بالذكاء الاصطناعي.",
        "proj_3_f1": "دمج المستشعرات المتقدم",
        "proj_3_f2": "اتخاذ القرار المستقل",
        "proj_3_f3": "اتصال بيانات مشفر",
        
        "contact_header_title": "الاتصال <span class='text-accent'>المؤسسي</span>",
        "contact_header_desc": "اتصل بنا للحصول على معلومات مفصلة حول مشاريعنا وخدماتنا المؤسسية.",
        "contact_info_title": "معلومات الاتصال",
        "contact_email_title": "البريد الإلكتروني",
        "contact_phone_title": "الهاتف / خدمة العملاء",
        "contact_address_title": "المكتب الرئيسي",
        "contact_address_val": "اسطنبول، تركيا",
        "contact_form_title": "ارسل رسالة",
        "contact_label_name": "الاسم واللقب / اسم الشركة",
        "contact_label_email": "البريد الإلكتروني المؤسسي",
        "contact_label_subject": "اختر الموضوع",
        "contact_opt_1": "معلومات المنتج (FiCo)",
        "contact_opt_2": "التعاون المؤسسي",
        "contact_opt_3": "الدعم الفني",
        "contact_opt_4": "أخرى",
        "contact_label_msg": "رسالة مفصلة",
        "contact_btn_send": "إرسال الطلب",
        "hero_prefix": "فرناس للتكنولوجيا؛",
        "hero_sub_prefix": "",
        "hero_typewriter_1": "تكنولوجيا الغد",
        "hero_typewriter_2": "أحلام الغد",
        "hero_typewriter_3": "مغامرة الغد",
        "hero_btn_explore": "استكشف النظام البيئي",
        "fico_preorder": "اطلب مسبقاً",
        "fico_hs_1_title": "دمج المستشعرات",
        "fico_hs_1_desc": "توفر مستشعرات الموجات فوق الصوتية والأشعة تحت الحمراء والتدفق البصري المدمجة تثبيتًا للطيران على مستوى المليمتر في المناطق المغلقة والمختبرات الخالية من نظام تحديد المواقع العالمي (GPS).",
        "fico_hs_2_title": "هيكل من ألياف الكربون",
        "fico_hs_2_desc": "يوفر هيكل القفص المصنوع من ألياف الكربون المقاوم للاصطدام بنسبة 100% والخفيف للغاية والمعياري رحلات تعليمية آمنة تمامًا في الفصول الدراسية.",
        "fico_hs_3_title": "معالج الذكاء الاصطناعي",
        "fico_hs_3_desc": "يمكّن معالجة الصور المستندة إلى لغة Python واكتشاف الكائنات في الوقت الفعلي ونماذج التعلم الآلي من العمل مباشرة في الهواء.",
        "fico_hs_4_title": "وحدة التحكم المتقدمة في الطيران",
        "fico_hs_4_desc": "توفر وحدة التحكم ثنائية النواة وخوارزميات الاستقرار المطورة محليًا ثباتًا فائقًا في التحليق.",
        "contact_title": "اتصل بنا",
        "contact_socials": "وسائل التواصل الاجتماعي",
        "contact_locations_title": "مواقعنا",
        "location_live": "مباشر",
        "location_office_title": "المكتب الرئيسي",
        "location_office_coords": "41.0343° N, 28.7909° E",
        "location_workshop_title": "ورشة الإنتاج",
        "location_workshop_coords": "41.0267° N, 29.0142° E",
        "location_expand_hint": "انقر للتوسيع"
    }
};"""

js_logic = """
function changeLanguage(lang) {
    localStorage.setItem('site_lang', lang);
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    // Check URL for language or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let urlLang = urlParams.get('lang');
    
    let currentLang = 'tr';
    if (urlLang) {
        currentLang = urlLang;
        localStorage.setItem('site_lang', currentLang);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        currentLang = localStorage.getItem('site_lang') || 'tr';
    }
    
    // Set the select box to correct language
    const langSelectors = document.querySelectorAll('.lang-selector select');
    langSelectors.forEach(select => {
        const options = Array.from(select.options);
        const targetOption = options.find(opt => opt.value === currentLang) || options[0];
        if (targetOption) {
            targetOption.selected = true;
        }
    });

    // Translate the page
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    if (translations[currentLang]) {
        elementsToTranslate.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) {
                el.innerHTML = translations[currentLang][key];
            }
        });

        // Add direction for Arabic
        if (currentLang === 'ar') {
            document.body.style.direction = 'rtl';
            document.body.style.textAlign = 'right';
            // Fix specific layout issues for RTL
            const navLinks = document.querySelectorAll('.nav-links');
            navLinks.forEach(nav => {
                nav.style.flexDirection = 'row-reverse';
            });
            const contentGrids = document.querySelectorAll('.content-grid');
            contentGrids.forEach(grid => {
                grid.style.direction = 'rtl';
            });
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.style.textAlign = 'right';
                input.style.direction = 'rtl';
            });
        } else {
            document.body.style.direction = 'ltr';
            document.body.style.textAlign = 'left';
            const navLinks = document.querySelectorAll('.nav-links');
            navLinks.forEach(nav => {
                nav.style.flexDirection = 'row';
            });
            const contentGrids = document.querySelectorAll('.content-grid');
            contentGrids.forEach(grid => {
                grid.style.direction = 'ltr';
            });
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.style.textAlign = 'left';
                input.style.direction = 'ltr';
            });
        }
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.boxShadow = '0 10px 25px rgba(0, 184, 212, 0.15)';
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.boxShadow = 'var(--shadow-sm)';
        }
    });

    // Typewriter effect for Hero section
    const typewriterEl = document.getElementById('hero-typewriter');
    if (typewriterEl) {
        const prefixEl = document.getElementById('hero-prefix');
        const subPrefixEl = document.getElementById('hero-sub-prefix');
        
        // Translate prefix & sub-prefix
        if (prefixEl && translations[currentLang]["hero_prefix"]) {
            prefixEl.innerHTML = translations[currentLang]["hero_prefix"];
        }
        if (subPrefixEl && translations[currentLang]["hero_sub_prefix"]) {
            subPrefixEl.innerHTML = translations[currentLang]["hero_sub_prefix"];
        }
        
        const words = [
            translations[currentLang]["hero_typewriter_1"] || "Teknolojisi",
            translations[currentLang]["hero_typewriter_2"] || "Hayalleri",
            translations[currentLang]["hero_typewriter_3"] || "Macerası"
        ];
        
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let delay = 100; // Typing speed
        
        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                delay = 40; // Deleting speed
            } else {
                typewriterEl.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                delay = 80; // Typing speed
            }
            
            if (!isDeleting && charIndex === currentWord.length) {
                delay = 2000; // Wait time at complete word
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                delay = 500; // Pause before starting next word
            }
            
            setTimeout(type, delay);
        }
        
        // Start typing after initial delay
        setTimeout(type, 300);
    }
    
    // Start terminal simulator
    typeTerminal();
});

// Interactive LocationMap Card Controller
function toggleMapCard(card, url) {
    if (card.classList.contains('expanded')) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    
    // Close other expanded cards
    document.querySelectorAll('.location-map-card').forEach(c => {
        if (c !== card) {
            c.classList.remove('expanded');
            const hint = c.querySelector('.map-click-hint');
            if (hint) {
                const currentLang = localStorage.getItem('site_lang') || 'tr';
                if (currentLang === 'tr') {
                    hint.textContent = 'Genişletmek için tıklayın';
                } else if (currentLang === 'ar') {
                    hint.textContent = 'انقر للتوسيع';
                } else {
                    hint.textContent = 'Click to expand';
                }
            }
        }
    });
    
    // Expand selected card
    card.classList.add('expanded');
    const hint = card.querySelector('.map-click-hint');
    if (hint) {
        const currentLang = localStorage.getItem('site_lang') || 'tr';
        if (currentLang === 'tr') {
            hint.textContent = 'Haritada açmak için tekrar tıklayın';
        } else if (currentLang === 'ar') {
            hint.textContent = 'انقر مجدداً لفتح الخريطة';
        } else {
            hint.textContent = 'Click again to open in Google Maps';
        }
    }
}

// Active Hotspot Switcher
function activateHotspot(specId) {
    document.querySelectorAll('.hotspot').forEach(hs => {
        hs.classList.remove('active');
    });
    document.querySelectorAll('.fico-spec-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeHs = document.getElementById('hs-' + specId);
    if (activeHs) activeHs.classList.add('active');
    
    const activeSpec = document.getElementById('spec-' + specId);
    if (activeSpec) activeSpec.classList.add('active');
}

// FiCo Terminal Simulator
let terminalIndex = 0;
const terminalLines = [
    "import fico_drone",
    "drone = fico_drone.connect()",
    "drone.takeoff(altitude=1.2)",
    "// [INFO] Uçuş stabilizasyonu aktif.",
    "drone.detect_object('ball', color='red')",
    "// [AI] Kırmızı nesne algılandı! Rota güncelleniyor...",
    "drone.follow_target()",
    "// [SYSTEM] Otonom STEM görevi tamamlandı."
];

function typeTerminal() {
    const term = document.getElementById("fico-terminal");
    if (!term) return;
    
    if (terminalIndex < terminalLines.length) {
        let line = terminalLines[terminalIndex];
        let p = document.createElement("p");
        p.style.margin = "0 0 8px 0";
        if (line.startsWith("//")) {
            p.style.color = "var(--accent)";
        } else {
            p.style.color = "#a6e22e";
        }
        term.appendChild(p);
        
        let charIndex = 0;
        function typeChar() {
            if (charIndex < line.length) {
                p.textContent += line[charIndex];
                charIndex++;
                setTimeout(typeChar, 30);
            } else {
                terminalIndex++;
                setTimeout(typeTerminal, 1000);
            }
        }
        typeChar();
    } else {
        setTimeout(() => {
            term.innerHTML = "";
            terminalIndex = 0;
            typeTerminal();
        }, 5000);
    }
}
"""

write_file('c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\first_project\\script.js', new_translations + "\n" + js_logic)

def update_html(filename):
    filepath = f"c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\first_project\\{filename}"
    content = read_file(filepath)
    
    # 1. Update <select> across all pages
    content = re.sub(
        r'<select onchange="window\.location\.href=this\.value;">[\s\S]*?</select>',
        '<select onchange="changeLanguage(this.value)">\n                            <option value="tr">🇹🇷 TR</option>\n                            <option value="en">🇬🇧 EN</option>\n                            <option value="ar">🇸🇦 AR</option>\n                        </select>',
        content
    )
    
    if filename == 'hakkimizda.html':
        content = content.replace('<h1>Kurumsal <span class="text-accent">Kimliğimiz</span></h1>', '<h1 data-i18n="about_header_title">Kurumsal <span class="text-accent">Kimliğimiz</span></h1>')
        content = content.replace('<p>Geçmişin ilhamıyla geleceğin yazılım ve havacılık teknolojilerini inşa eden teknoloji merkezi.</p>', '<p data-i18n="about_header_desc">Geçmişin ilhamıyla geleceğin yazılım ve havacılık teknolojilerini inşa eden teknoloji merkezi.</p>')
        
        content = content.replace('<h3>İlhamımızı Gökyüzünden,<br>Gücümüzü <span class="text-accent">Yazılımdan</span> Alıyoruz</h3>', '<h3 data-i18n="about_content_title">İlhamımızı Gökyüzünden,<br>Gücümüzü <span class="text-accent">Yazılımdan</span> Alıyoruz</h3>')
        content = content.replace('<p>Adımız, tarihteki ilk planör uçuşunu gerçekleştiren büyük mucit <strong>Abbas Kasım İbn Firnas</strong>\'tan gelmektedir. Onun cesareti ve bilime olan tutkusu, kurumsal vizyonumuzun temelini oluşturuyor.</p>', '<p data-i18n="about_content_p1">Adımız, tarihteki ilk planör uçuşunu gerçekleştiren büyük mucit <strong>Abbas Kasım İbn Firnas</strong>\'tan gelmektedir. Onun cesareti ve bilime olan tutkusu, kurumsal vizyonumuzun temelini oluşturuyor.</p>')
        content = content.replace('<p>Firnas Technologies olarak, sadece bir donanım sağlayıcısı değil; aynı zamanda donanımları zeki kılan algoritmaları ve sistemleri üreten profesyonel bir <strong>yazılım ve teknoloji şirketiyiz</strong>. Amacımız, ülkemizin bağımsız teknoloji hedeflerine katkıda bulunmaktır.</p>', '<p data-i18n="about_content_p2">Firnas Technologies olarak, sadece bir donanım sağlayıcısı değil; aynı zamanda donanımları zeki kılan algoritmaları ve sistemleri üreten profesyonel bir <strong>yazılım ve teknoloji şirketiyiz</strong>. Amacımız, ülkemizin bağımsız teknoloji hedeflerine katkıda bulunmaktır.</p>')
        
        content = content.replace('<h2>Yönetim ve <span class="text-accent">Mühendislik Ekibi</span></h2>', '<h2 data-i18n="about_team_title">Yönetim ve <span class="text-accent">Mühendislik Ekibi</span></h2>')
        content = content.replace('<p>Başarılarımızın arkasındaki uzman kadromuz.</p>', '<p data-i18n="about_team_desc">Başarılarımızın arkasındaki uzman kadromuz.</p>')
        
        content = content.replace('<p>Kurucu</p>', '<p data-i18n="team_1_role">Kurucu</p>')
        content = content.replace('<p>Elektronik Birim Sorumlusu</p>', '<p data-i18n="team_2_role">Elektronik Birim Sorumlusu</p>')
        content = content.replace('<h3>Yazılım Ekibi</h3>', '<h3 data-i18n="team_3_name">Yazılım Ekibi</h3>')
        content = content.replace('<p>Sistem ve Otonomi Geliştirme</p>', '<p data-i18n="team_3_role">Sistem ve Otonomi Geliştirme</p>')

    elif filename == 'projeler.html':
        content = content.replace('<h1>Ürünler ve <span class="text-accent">Projeler</span></h1>', '<h1 data-i18n="projects_header_title">Ürünler ve <span class="text-accent">Projeler</span></h1>')
        content = content.replace('<p>Yerli kaynaklarla geliştirdiğimiz, profesyonel havacılık ve yazılım çözümlerimiz.</p>', '<p data-i18n="projects_header_desc">Yerli kaynaklarla geliştirdiğimiz, profesyonel havacılık ve yazılım çözümlerimiz.</p>')
        
        content = content.replace('<div class="hero-badge">Eğitim Teknolojileri</div>', '<div class="hero-badge" data-i18n="proj_1_badge">Eğitim Teknolojileri</div>')
        content = content.replace('<p>FiCo, kurumların ve okulların mühendislik eğitimlerinde kullanabileceği, donanımı ve yazılımı tamamen yerli olan profesyonel eğitim dronudur.</p>', '<p data-i18n="proj_1_desc">FiCo, kurumların ve okulların mühendislik eğitimlerinde kullanabileceği, donanımı ve yazılımı tamamen yerli olan profesyonel eğitim dronudur.</p>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Yerli Uçuş Kontrol Sistemleri</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_1_f1">Yerli Uçuş Kontrol Sistemleri</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Açık Kaynak Geliştirme Platformu</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_1_f2">Açık Kaynak Geliştirme Platformu</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Kurumsal AR-GE ve Yapay Zeka Desteği</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_1_f3">Kurumsal AR-GE ve Yapay Zeka Desteği</span></li>')
        
        content = content.replace('<p>Savunma sanayisi standartlarına uygun olarak tasarlanan ÜSKA, otonom yapay zeka sistemleriyle donatılmış profesyonel bir İnsansız Hava Aracıdır.</p>', '<p data-i18n="proj_2_desc">Savunma sanayisi standartlarına uygun olarak tasarlanan ÜSKA, otonom yapay zeka sistemleriyle donatılmış profesyonel bir İnsansız Hava Aracıdır.</p>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Endüstriyel Veri Analizi</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_2_f1">Endüstriyel Veri Analizi</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Gerçek Zamanlı Görüntü İşleme</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_2_f2">Gerçek Zamanlı Görüntü İşleme</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Yüksek Otonomi Algoritmaları</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_2_f3">Yüksek Otonomi Algoritmaları</span></li>')
        
        content = content.replace('<p>Güvenlik ihtiyaçlarına yönelik olarak geliştirilen MUHAFIZ, yapay zeka güdümlü hassas bir takip ve savunma sistemi konseptidir.</p>', '<p data-i18n="proj_3_desc">Güvenlik ihtiyaçlarına yönelik olarak geliştirilen MUHAFIZ, yapay zeka güdümlü hassas bir takip ve savunma sistemi konseptidir.</p>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Gelişmiş Sensör Füzyonu</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_3_f1">Gelişmiş Sensör Füzyonu</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Otonom Karar Alma Yeteneği</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_3_f2">Otonom Karar Alma Yeteneği</span></li>')
        content = content.replace('<li><i class="fas fa-check-circle"></i> <span>Kriptolu Veri İletişimi</span></li>', '<li><i class="fas fa-check-circle"></i> <span data-i18n="proj_3_f3">Kriptolu Veri İletişimi</span></li>')

    elif filename == 'iletisim.html':
        content = content.replace('<h1>Kurumsal <span class="text-accent">İletişim</span></h1>', '<h1 data-i18n="contact_header_title">Kurumsal <span class="text-accent">İletişim</span></h1>')
        content = content.replace('<p>Projelerimiz ve kurumsal hizmetlerimiz hakkında detaylı bilgi almak için bizimle iletişime geçin.</p>', '<p data-i18n="contact_header_desc">Projelerimiz ve kurumsal hizmetlerimiz hakkında detaylı bilgi almak için bizimle iletişime geçin.</p>')
        
        content = content.replace('<h3 style="font-size: 1.8rem; margin-bottom: 2.5rem; color: #fff;">İletişim Bilgileri</h3>', '<h3 data-i18n="contact_info_title" style="font-size: 1.8rem; margin-bottom: 2.5rem; color: #fff;">İletişim Bilgileri</h3>')
        content = content.replace('<h4 style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">E-Posta</h4>', '<h4 data-i18n="contact_email_title" style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">E-Posta</h4>')
        content = content.replace('<h4 style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">Telefon / Müşteri Hizmetleri</h4>', '<h4 data-i18n="contact_phone_title" style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">Telefon / Müşteri Hizmetleri</h4>')
        content = content.replace('<h4 style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">Merkez Ofis</h4>', '<h4 data-i18n="contact_address_title" style="margin-bottom: 0.25rem; color: #fff; font-size: 1.1rem;">Merkez Ofis</h4>')
        content = content.replace('<p style="color: #cbd5e1;">İstanbul, Türkiye</p>', '<p data-i18n="contact_address_val" style="color: #cbd5e1;">İstanbul, Türkiye</p>')
        
        content = content.replace('<h3 style="font-size: 1.8rem; margin-bottom: 2rem;">Mesaj Gönderin</h3>', '<h3 data-i18n="contact_form_title" style="font-size: 1.8rem; margin-bottom: 2rem;">Mesaj Gönderin</h3>')
        content = content.replace('<label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Ad Soyad / Kurum Adı</label>', '<label data-i18n="contact_label_name" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Ad Soyad / Kurum Adı</label>')
        content = content.replace('<label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Kurumsal E-Posta</label>', '<label data-i18n="contact_label_email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Kurumsal E-Posta</label>')
        content = content.replace('<label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Konu Seçimi</label>', '<label data-i18n="contact_label_subject" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Konu Seçimi</label>')
        
        content = content.replace('<option>Ürün Bilgisi (FiCo)</option>', '<option data-i18n="contact_opt_1">Ürün Bilgisi (FiCo)</option>')
        content = content.replace('<option>Kurumsal İşbirliği</option>', '<option data-i18n="contact_opt_2">Kurumsal İşbirliği</option>')
        content = content.replace('<option>Teknik Destek</option>', '<option data-i18n="contact_opt_3">Teknik Destek</option>')
        content = content.replace('<option>Diğer</option>', '<option data-i18n="contact_opt_4">Diğer</option>')
        
        content = content.replace('<label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Detaylı Mesajınız</label>', '<label data-i18n="contact_label_msg" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Detaylı Mesajınız</label>')
        content = content.replace('<button type="button" class="btn btn-primary" style="width: 100%; font-size: 1rem; padding: 1rem; border-radius: 8px;">Talebi İlet</button>', '<button type="button" class="btn btn-primary" data-i18n="contact_btn_send" style="width: 100%; font-size: 1rem; padding: 1rem; border-radius: 8px;">Talebi İlet</button>')

    write_file(filepath, content)

for f in ['index.html', 'hakkimizda.html', 'projeler.html', 'iletisim.html']:
    update_html(f)

print("Done updating files!")
