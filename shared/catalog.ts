export type Lang = 'zh' | 'en' | 'ja';
export type Label = Record<Lang, string>;
export const L = (zh: string, en: string, ja: string): Label => ({ zh, en, ja });
export interface Option { value: string; label: Label }
export interface Field { id: string; label: Label; type: 'text' | 'textarea' | 'date' | 'number' | 'email' | 'tel' | 'select'; options?: Option[]; unit?: string }
export interface Section { id: string; label: Label; repeated: boolean; fields: Field[] }
const options = (rows: [string, string, string, string][]): Option[] => rows.map(([value, zh, en, ja]) => ({ value, label: L(zh, en, ja) }));
const f = (id: string, zh: string, en: string, ja: string, type: Field['type'] = 'text', opts?: Option[], unit?: string): Field => ({ id, label: L(zh, en, ja), type, options: opts, unit });
const yesNo = options([['yes','是','Yes','はい'],['no','否','No','いいえ']]);
const levels = options([['school','校级','School','学校'],['district','区县级','District / county','区・県'],['city','市级','City','市'],['provincial','省部级','Provincial / ministerial','省・部'],['national','国家级','National','国家'],['international','国际','International','国際'],['other','其他','Other','その他']]);
const dates = [f('startDate','开始日期','Start date','開始日','date'),f('endDate','结束日期','End date','終了日','date')];
export const catalog: Section[] = [
  { id:'identity', label:L('身份与身体信息','Identity & physical information','身元・身体情報'), repeated:false, fields:[
    f('name','姓名','Full name','氏名'),f('englishName','英文姓名','English name','英語名'),f('formerName','曾用名','Former name','旧名'),
    f('gender','性别','Gender','性別','select',options([['male','男','Male','男性'],['female','女','Female','女性'],['other','其他','Other','その他'],['undisclosed','不披露','Prefer not to disclose','回答しない']])),
    f('birthDate','出生日期','Date of birth','生年月日','date'),f('nationality','国籍','Nationality','国籍'),f('ethnicity','民族','Ethnicity','民族'),
    f('birthplace','出生地','Place of birth','出生地'),f('nativePlace','籍贯','Ancestral home','本籍地'),f('height','身高','Height','身長','number',undefined,'cm'),
    f('weight','体重','Weight','体重','number',undefined,'kg'),f('religion','宗教信仰','Religion','宗教'),f('maritalStatus','婚姻状况','Marital status','婚姻状況'),
    f('healthStatus','健康状况','Health information','健康状態'),f('disabilityStatus','残疾情况','Disability information','障害に関する情報'),
    f('bloodType','血型','Blood type','血液型'),f('idType','证件类型','Identity document type','本人確認書類の種類'),f('idNumber','证件号码','Identity document number','本人確認書類番号'),
    f('idExpiry','证件有效期','Document expiry','有効期限','date'),f('passportNumber','护照号码','Passport number','パスポート番号'),f('passportExpiry','护照有效期','Passport expiry','パスポート有効期限','date')
  ]},
  { id:'contact', label:L('联系方式与户籍','Contact & residence','連絡先・居住情報'), repeated:false, fields:[
    f('phone','手机号','Mobile phone','携帯電話','tel'),f('alternatePhone','备用电话','Alternate phone','予備電話','tel'),f('email','邮箱','Email','メール','email'),
    f('country','现居国家/地区','Country / region','居住国・地域'),f('province','现居省份','Province / state','省・州'),f('city','现居城市','City','市区町村'),
    f('district','区县','District','地区'),f('address','详细地址','Street address','住所'),f('postalCode','邮政编码','Postal code','郵便番号'),
    f('hukouProvince','户籍省份','Household registration province','戸籍所在地（省）'),f('hukouCity','户籍城市','Household registration city','戸籍所在地（市）'),
    f('hukouAddress','户籍详细地址','Registered address','戸籍住所'),f('hukouType','户籍性质','Household registration type','戸籍区分'),
    f('archiveLocation','档案所在地','Personnel archive location','人事記録保管先'),f('archiveUnit','档案保管单位','Archive custodian','人事記録保管機関'),
    f('wechat','微信','WeChat','WeChat'),f('linkedin','LinkedIn','LinkedIn','LinkedIn'),f('github','GitHub','GitHub','GitHub'),f('website','个人网站','Personal website','個人サイト')
  ]},
  { id:'political', label:L('政治面貌与服役','Political affiliation & service','政治所属・兵役'), repeated:false, fields:[
    f('affiliation','政治面貌','Political affiliation','政治所属','select',options([['cpc','中共党员','CPC member','中国共産党員'],['probationary','中共预备党员','Probationary CPC member','中国共産党予備党員'],['league','共青团员','Communist Youth League member','共産主義青年団員'],['other-party','其他党派','Other political party','その他の政党'],['none','群众','No party affiliation','無所属']])),
    f('partyName','党派名称','Party name','政党名'),f('partyJoinDate','入党时间','Party admission date','入党日','date'),f('partyConfirmationDate','转正时间','Full membership date','正式党員登録日','date'),
    f('leagueJoinDate','入团时间','Youth League admission date','入団日','date'),f('organization','党组织关系所在单位','Party organization','所属党組織'),
    f('politicalPosition','党内职务','Party position held','党内役職'),f('militaryStatus','兵役情况','Military service status','兵役状況'),f('serviceStart','服役开始日期','Service start date','入隊日','date'),f('serviceEnd','退役日期','Discharge date','除隊日','date'),f('serviceUnit','服役单位','Service unit','所属部隊')
  ]},
  { id:'education', label:L('教育经历','Education','学歴'), repeated:true, fields:[
    f('school','学校名称','Institution name','学校名'),f('schoolEnglish','学校英文名称','Institution English name','学校英語名'),f('schoolCode','学校代码','Institution code','学校コード'),
    f('department','院系名称','Faculty / department','学部・研究科'),f('major','专业名称','Major','専攻'),f('majorCode','专业代码','Major code','専攻コード'),
    f('researchDirection','研究方向','Research area','研究分野'),f('supervisor','导师姓名','Supervisor','指導教員'),f('admissionDate','入学日期','Enrollment date','入学日','date'),f('graduationDate','毕业日期','Graduation date','卒業日','date'),
    f('isCurrent','是否在读','Currently enrolled','在学中','select',yesNo),f('country','学校所在国家/地区','Institution country / region','学校所在地（国・地域）'),f('city','学校所在城市','Institution city','学校所在地（市）'),
    f('inChina','是否位于中国境内','Located in mainland China','中国本土の学校','select',yesNo),
    f('educationLevel','学历层次','Education level','学歴区分','select',options([['secondary','中专/高中','Secondary','高校・中等専門'],['associate','专科','Associate / junior college','短期大学・専科'],['bachelor','本科','Undergraduate','学部'],['master','硕士研究生','Master’s program','修士課程'],['doctor','博士研究生','Doctoral program','博士課程'],['other','其他','Other','その他']])),
    f('degreeType','学位名称（如工学学士、理学博士）','Degree title (e.g. B.Eng., Ph.D. in Science)','学位名（工学学士・理学博士など）'),f('degreeAwardDate','学位授予日期','Degree award date','学位授与日','date'),
    f('studyMode','授课/培养类型','Study / admission mode','入学・履修形態','select',options([['fulltime','统招全日制','Regular full-time','一般入試・全日制'],['directed','定向','Directed enrollment','定向（指定就職型）'],['adult','成人教育','Adult education','成人教育'],['parttime','非全日制','Part-time','非全日制'],['selfstudy','自学考试','Self-study examination','独学試験'],['distance','网络/远程教育','Distance learning','通信・遠隔教育'],['overseas','境外教育','Overseas education','海外教育'],['other','其他','Other','その他']])),
    f('gpa','绩点/平均成绩','GPA / average grade','GPA・平均点','number'),f('gpaScale','绩点制/满分','Grading scale / maximum','成績尺度・満点','select',options([['4','4分制','4-point scale','4点満点'],['5','5分制','5-point scale','5点満点'],['100','百分制','100-point scale','100点満点'],['other','其他','Other','その他']])),f('customGpaScale','其他绩点制满分','Other grading maximum','その他の満点','number'),
    f('rank','排名','Class rank','順位','number'),f('cohortSize','总人数','Cohort size','総人数','number'),f('rankingScope','排名范围（专业/年级等）','Ranking scope','順位の対象'),
    f('courses','已修核心课程','Core courses completed','履修済み主要科目','textarea'),f('thesisTitle','论文题目','Thesis title','論文題目'),f('thesisDescription','论文研究内容','Thesis research','論文研究内容','textarea'),
    f('diplomaNumber','毕业证编号','Diploma number','卒業証書番号'),f('degreeNumber','学位证编号','Degree certificate number','学位記番号'),f('verificationNumber','学历验证报告编号','Education verification number','学歴認証番号'),
    f('overseasCertification','境外学历认证情况','Overseas qualification recognition','海外学歴認証状況'),f('schoolCategory','学校类别（如双一流等）','Institution classification','学校区分'),f('isHighest','是否最高学历','Highest education','最終学歴','select',yesNo)
  ]},
  { id:'employment', label:L('工作经历','Employment','職歴'), repeated:true, fields:[
    f('company','公司名称','Employer','勤務先'),f('companyEnglish','公司英文名称','Employer English name','勤務先英語名'),f('industry','行业','Industry','業界'),f('ownership','单位性质','Organization ownership','組織形態'),
    f('department','部门','Department','部署'),f('position','职位','Job title','役職'),f('employmentType','用工类型','Employment type','雇用形態'),...dates,
    f('current','是否在职','Currently employed','在職中','select',yesNo),f('country','工作国家/地区','Country / region','勤務国・地域'),f('city','工作城市','Work city','勤務地'),
    f('responsibilities','实际工作职责','Actual responsibilities','実際の職務内容','textarea'),f('achievements','已实现的工作成果','Documented achievements','実績','textarea'),
    f('technologies','实际使用技术','Technologies used','使用技術'),f('teamSize','团队人数','Team size','チーム人数','number'),f('reportingTo','汇报对象职务','Reporting line','報告先の役職'),
    f('departureReason','实际离职原因','Reason for leaving','退職理由','textarea'),f('salary','实际薪资及币种','Actual compensation & currency','実際の給与・通貨'),
    f('referenceName','证明人','Reference contact','照会先氏名'),f('referenceTitle','证明人职位','Reference title','照会先役職'),f('referencePhone','证明人电话','Reference phone','照会先電話','tel'),f('referenceEmail','证明人邮箱','Reference email','照会先メール','email')
  ]},
  { id:'internships', label:L('实习经历','Internships','インターンシップ'), repeated:true, fields:[
    f('company','实习单位','Organization','実習先'),f('department','部门','Department','部署'),f('position','实习岗位','Position','職種'),f('industry','行业','Industry','業界'),...dates,
    f('city','实习城市','City','都市'),f('hoursPerWeek','每周工作时数','Hours per week','週の勤務時間','number'),f('responsibilities','实际职责','Responsibilities','職務内容','textarea'),
    f('achievements','实际成果','Achievements','実績','textarea'),f('technologies','使用技术','Technologies','使用技術'),f('mentor','指导人','Mentor','指導者'),f('referencePhone','证明人电话','Reference phone','照会先電話','tel'),f('referenceEmail','证明人邮箱','Reference email','照会先メール','email')
  ]},
  { id:'projects', label:L('项目经历','Projects','プロジェクト'), repeated:true, fields:[
    f('name','项目名称','Project name','プロジェクト名'),f('organization','所属单位','Organization','所属組織'),f('type','项目类型','Project type','種類'),f('role','实际承担角色','Role held','担当役割'),...dates,
    f('teamSize','项目人数','Team size','人数','number'),f('background','项目背景','Background','背景','textarea'),f('responsibilities','实际职责','Responsibilities','担当内容','textarea'),
    f('technologies','技术栈','Technology stack','技術構成'),f('outcomes','已实现成果/指标','Realized outcomes / metrics','成果・指標','textarea'),f('url','项目链接','Project URL','URL'),f('repository','代码仓库','Repository','リポジトリ'),f('funding','实际经费','Funding','研究費・予算'),f('identifier','项目编号','Project identifier','管理番号')
  ]},
  { id:'awards', label:L('表彰与奖项','Honors & awards','表彰・受賞'), repeated:true, fields:[
    f('name','奖项名称','Award name','賞名'),f('issuer','授予单位','Awarding organization','授与機関'),f('awardDate','授予时间','Award date','授与日','date'),f('level','奖项等级','Award scope','受賞規模','select',levels),
    f('grade','等次（一等奖/金奖等）','Award grade (first prize, gold, etc.)','等級（金賞など）'),f('category','奖项类别','Category','分類'),f('description','奖项描述','Award description','説明','textarea'),
    f('rank','获奖名次','Rank','順位','number'),f('participants','参评人数','Participant count','参加人数','number'),f('individualOrTeam','个人/团队奖','Individual / team award','個人・団体賞'),f('certificateNumber','证书编号','Certificate number','証書番号'),f('evidenceUrl','证明链接','Evidence URL','証明URL')
  ]},
  { id:'skills', label:L('技能与语言','Skills & languages','スキル・言語'), repeated:true, fields:[
    f('name','技能/语言名称','Skill / language','スキル・言語名'),f('category','类别','Category','分類'),f('level','用户声明的熟练程度','User-declared proficiency','本人申告の習熟度'),
    f('years','实际使用年限','Years of use','使用年数','number'),f('lastUsed','最近使用日期','Last used','最終使用日','date'),f('evidence','实际使用场景/证明','Use cases / evidence','使用実績・証明','textarea'),f('test','语言考试名称','Language test','語学試験'),f('score','考试成绩','Test score','試験成績'),f('scoreMaximum','考试满分','Maximum score','満点'),f('testDate','考试日期','Test date','受験日','date')
  ]},
  { id:'certificates', label:L('证书与职业资格','Certificates & licenses','資格・免許'), repeated:true, fields:[
    f('name','证书名称','Certificate name','資格名'),f('issuer','颁发机构','Issuing organization','発行機関'),f('category','证书类别','Category','分類'),f('level','等级','Level','等級'),
    f('number','证书编号','Certificate number','証書番号'),f('issueDate','取得日期','Issue date','取得日','date'),f('expiryDate','有效期至','Expiry date','有効期限','date'),f('permanent','是否长期有效','No expiry','無期限','select',yesNo),
    f('score','成绩','Score','成績'),f('verificationUrl','验证链接','Verification URL','認証URL'),f('description','证书说明','Description','説明','textarea')
  ]},
  { id:'family', label:L('家庭成员','Family members','家族'), repeated:true, fields:[
    f('name','姓名','Name','氏名'),f('relationship','关系','Relationship','続柄'),f('phone','电话','Phone','電話','tel'),f('occupation','职业','Occupation','職業'),f('organization','单位','Employer / organization','勤務先'),
    f('position','职务','Position','役職'),f('birthDate','出生日期','Date of birth','生年月日','date'),f('age','年龄（登记时）','Age at entry','登録時の年齢','number'),f('ageAsOf','年龄对应日期','Age reference date','年齢基準日','date'),
    f('politicalAffiliation','政治面貌','Political affiliation','政治所属'),f('address','居住地址','Address','住所'),f('isEmergencyContact','是否紧急联系人','Emergency contact','緊急連絡先','select',yesNo)
  ]},
  { id:'publications', label:L('论文、专利与著作','Publications & patents','論文・特許・著書'), repeated:true, fields:[
    f('title','名称','Title','題名'),f('type','成果类型','Type','種類'),f('authors','作者/发明人','Authors / inventors','著者・発明者'),f('authorOrder','本人排序','Authorship position','著者順位'),
    f('venue','期刊/会议/出版社','Journal / conference / publisher','誌名・会議・出版社'),f('date','发表/授权日期','Publication / grant date','発表・登録日','date'),f('number','DOI/专利号/ISBN','DOI / patent / ISBN','DOI・特許番号・ISBN'),f('status','实际状态','Current status','実際の状態'),f('indexing','收录情况','Indexing','収録情報'),f('url','链接','URL','URL'),f('description','成果内容','Description','成果内容','textarea')
  ]},
  { id:'activities', label:L('校园任职与志愿经历','Campus & volunteering','学内活動・ボランティア'), repeated:true, fields:[
    f('organization','组织名称','Organization','組織名'),f('role','实际职务','Role held','役職'),...dates,f('hours','累计时数','Total hours','合計時間','number'),f('description','实际工作内容','Activities performed','活動内容','textarea'),f('achievements','实际成果','Achievements','実績','textarea'),f('reference','证明人/证明链接','Reference / evidence URL','照会先・証明URL')
  ]},
  { id:'eligibility', label:L('身份资格与其他事实','Eligibility & other facts','応募資格・その他の事実'), repeated:false, fields:[
    f('employmentStatus','当前就业状态','Current employment status','現在の就業状況'),f('graduateStatus','应届身份（已核实）','Verified graduate status','確認済み新卒資格'),f('firstEmployment','是否首次就业','First employment','初めての就職','select',yesNo),
    f('workAuthorization','工作许可/资格','Work authorization','就労資格'),f('visaType','签证类型','Visa type','ビザの種類'),f('visaExpiry','签证到期日期','Visa expiry','ビザ有効期限','date'),
    f('residencePermit','居住证情况','Residence permit','居住許可'),f('drivingLicense','驾照类型','Driving license class','運転免許'),f('drivingLicenseDate','驾照取得日期','License issue date','免許取得日','date'),
    f('priorApplication','既往应聘记录','Previous applications','過去の応募記録','textarea'),f('relativesAtCompany','亲属任职事实','Relatives employed at organizations','親族の勤務情報','textarea'),f('disciplinaryRecord','处分记录','Disciplinary record','処分歴','textarea')
  ]},
  { id:'custom', label:L('自定义客观事实','Custom objective facts','独自の客観的事実'), repeated:true, fields:[
    f('name','字段名称','Field name','項目名'),f('value','事实内容','Fact value','事実内容','textarea'),f('source','资料来源','Source','情報源'),f('asOf','事实对应日期','As-of date','基準日','date')
  ]}
];
export type FactValues = Record<string, string>;
export interface FactRecord { id: string; values: FactValues }
export interface Profile { sections: Record<string, FactRecord[]> }
export const emptyProfile = (): Profile => ({ sections: Object.fromEntries(catalog.map(s => [s.id, s.repeated ? [] : [{ id:s.id, values:{} }]])) });
export function factCount(profile: Profile) { return Object.values(profile.sections).flatMap(r => r).reduce((n, r) => n + Object.values(r.values).filter(v => v.trim()).length, 0); }
