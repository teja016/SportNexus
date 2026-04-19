import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SportNexus database...')

  // ─── Users ───────────────────────────────────────────────────────────────
  const testUser = await prisma.user.upsert({
    where: { email: 'user@sportshub.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'user@sportshub.com',
      phone: '+919999999999',
      role: 'USER',
      homeLat: 17.4401,
      homeLng: 78.3489,
      homeAddress: 'Banjara Hills, Hyderabad',
    },
  })

  await prisma.user.upsert({
    where: { email: 'superadmin@sportshub.com' },
    update: {},
    create: { name: 'Super Admin', email: 'superadmin@sportshub.com', phone: '+918888888880', role: 'SUPER_ADMIN' },
  })

  const admins = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin1@sportshub.com' },
      update: {},
      create: { name: 'Vijay Kumar', email: 'admin1@sportshub.com', phone: '+918888888881', role: 'ACADEMY_ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'admin2@sportshub.com' },
      update: {},
      create: { name: 'Priya Reddy', email: 'admin2@sportshub.com', phone: '+918888888882', role: 'ACADEMY_ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'admin3@sportshub.com' },
      update: {},
      create: { name: 'Arun Patel', email: 'admin3@sportshub.com', phone: '+918888888883', role: 'ACADEMY_ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'admin4@sportshub.com' },
      update: {},
      create: { name: 'Sneha Iyer', email: 'admin4@sportshub.com', phone: '+918888888884', role: 'ACADEMY_ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'admin5@sportshub.com' },
      update: {},
      create: { name: 'Kiran Rao', email: 'admin5@sportshub.com', phone: '+918888888885', role: 'ACADEMY_ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'admin6@sportshub.com' },
      update: {},
      create: { name: 'Arjun Reddy', email: 'admin6@sportshub.com', phone: '+918888888886', role: 'ACADEMY_ADMIN' },
    }),
  ])

  console.log(`✅ Created ${admins.length + 1} users`)

  // ─── Academies ───────────────────────────────────────────────────────────
  const academies = await Promise.all([
    prisma.academy.upsert({
      where: { id: 'academy_champions' },
      update: {},
      create: {
        id: 'academy_champions',
        name: 'Champions Cricket Academy',
        description: 'Premier cricket training facility in Hyderabad with BCCI-certified coaches, world-class nets, and video analysis technology.',
        address: '12, Road No. 5, Banjara Hills, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4156,
        lng: 78.4347,
        rating: 4.8,
        reviewCount: 124,
        transportAvailable: true,
        phone: '+914023456789',
        email: 'info@championscricket.com',
        isVerified: true,
        adminUserId: admins[0].id,
      },
    }),
    prisma.academy.upsert({
      where: { id: 'academy_kickstart' },
      update: {},
      create: {
        id: 'academy_kickstart',
        name: 'KickStart Football Club',
        description: 'AFC-affiliated football academy offering structured training programs for all age groups. Home to 3 state-level players.',
        address: '45, Hitech City Road, Madhapur, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4432,
        lng: 78.3773,
        rating: 4.6,
        reviewCount: 89,
        transportAvailable: true,
        phone: '+914023456790',
        email: 'info@kickstartfc.com',
        isVerified: true,
        adminUserId: admins[1].id,
      },
    }),
    prisma.academy.upsert({
      where: { id: 'academy_aquazone' },
      update: {},
      create: {
        id: 'academy_aquazone',
        name: 'AquaZone Swimming Centre',
        description: 'Olympic-length pool with heated water, 6 lanes, and SAI-certified swimming coaches. Specializes in competitive and recreational swimming.',
        address: '8, Jubilee Hills Check Post, Jubilee Hills, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4337,
        lng: 78.4076,
        rating: 4.9,
        reviewCount: 213,
        transportAvailable: false,
        phone: '+914023456791',
        email: 'info@aquazonehyd.com',
        isVerified: true,
        adminUserId: admins[2].id,
      },
    }),
    prisma.academy.upsert({
      where: { id: 'academy_courtside' },
      update: {},
      create: {
        id: 'academy_courtside',
        name: 'CourtSide Racquet Academy',
        description: 'State-of-the-art tennis and badminton facility with 4 international-standard courts and AITA-certified coaches.',
        address: '22, DLF Cybercity, Gachibowli, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4429,
        lng: 78.3489,
        rating: 4.5,
        reviewCount: 67,
        transportAvailable: true,
        phone: '+914023456792',
        email: 'info@courtsidehyd.com',
        isVerified: true,
        adminUserId: admins[3].id,
      },
    }),
    prisma.academy.upsert({
      where: { id: 'academy_allstars' },
      update: {},
      create: {
        id: 'academy_allstars',
        name: 'AllStars Multi-Sport Hub',
        description: 'Multi-discipline sports complex offering cricket, football, basketball, and athletics under one roof with expert coaches.',
        address: '56, Kondapur Main Road, Kondapur, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4598,
        lng: 78.3523,
        rating: 4.7,
        reviewCount: 156,
        transportAvailable: false,
        phone: '+914023456793',
        email: 'info@allstarshyd.com',
        isVerified: true,
        adminUserId: admins[4].id,
      },
    }),
    prisma.academy.upsert({
      where: { id: 'academy_gachibowli' },
      update: {},
      create: {
        id: 'academy_gachibowli',
        name: 'Gachibowli Stadium Athletics',
        description: 'Hyderabad\'s premier athletics facility at the iconic Gachibowli Stadium. SAI-certified track & field coaches, 400m synthetic track, long-jump pits, shot put arenas, and video-assisted biomechanics coaching. Home to multiple national-level athletes.',
        address: 'Gachibowli Indoor Stadium, Gachibowli, Hyderabad',
        city: 'Hyderabad',
        lat: 17.4239,
        lng: 78.3440,
        rating: 4.9,
        reviewCount: 241,
        transportAvailable: true,
        phone: '+914023456794',
        email: 'info@gachibowlistadium.com',
        isVerified: true,
        adminUserId: admins[5].id,
      },
    }),
  ])

  console.log(`✅ Created ${academies.length} academies`)

  // ─── Academy Photos ───────────────────────────────────────────────────────
  await prisma.academyPhoto.createMany({
    skipDuplicates: true,
    data: [
      { academyId: 'academy_champions', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', isPrimary: true, altText: 'Cricket nets at Champions Academy' },
      { academyId: 'academy_champions', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800', isPrimary: false, altText: 'Champions Academy coaching session' },
      { academyId: 'academy_champions', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', isPrimary: false, altText: 'Champions Academy facilities' },
      { academyId: 'academy_kickstart', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', isPrimary: true, altText: 'Football training at KickStart' },
      { academyId: 'academy_kickstart', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', isPrimary: false, altText: 'KickStart FC match' },
      { academyId: 'academy_kickstart', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800', isPrimary: false, altText: 'KickStart FC ground' },
      { academyId: 'academy_aquazone', url: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800', isPrimary: true, altText: 'AquaZone Olympic pool' },
      { academyId: 'academy_aquazone', url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800', isPrimary: false, altText: 'Swimming training' },
      { academyId: 'academy_aquazone', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', isPrimary: false, altText: 'AquaZone facilities' },
      { academyId: 'academy_courtside', url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', isPrimary: true, altText: 'Tennis court at CourtSide' },
      { academyId: 'academy_courtside', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800', isPrimary: false, altText: 'CourtSide racquet training' },
      { academyId: 'academy_courtside', url: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800', isPrimary: false, altText: 'CourtSide facilities' },
      { academyId: 'academy_allstars', url: 'https://images.unsplash.com/photo-1546519638492-4827eff40467?w=800', isPrimary: true, altText: 'AllStars basketball court' },
      { academyId: 'academy_allstars', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', isPrimary: false, altText: 'AllStars multi-sport' },
      { academyId: 'academy_allstars', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', isPrimary: false, altText: 'AllStars athletics track' },
      { academyId: 'academy_gachibowli', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', isPrimary: true, altText: 'Gachibowli Stadium athletics track' },
      { academyId: 'academy_gachibowli', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', isPrimary: false, altText: 'Sprint training at Gachibowli' },
      { academyId: 'academy_gachibowli', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', isPrimary: false, altText: 'Athletics field events' },
    ],
  })

  console.log('✅ Created academy photos')

  // ─── Coaches ─────────────────────────────────────────────────────────────
  await prisma.coach.createMany({
    skipDuplicates: true,
    data: [
      { id: 'coach_001', academyId: 'academy_champions', name: 'Ravi Shastri Kumar', photo: 'https://i.pravatar.cc/150?img=11', sportTags: ['Cricket'], experienceYears: 15, bio: 'Former Ranji Trophy player with 15 years coaching experience. Specializes in batting technique and mental conditioning.', certifications: ['BCCI Level 3', 'NCA Certified'] },
      { id: 'coach_002', academyId: 'academy_champions', name: 'Sreekant Nair', photo: 'https://i.pravatar.cc/150?img=12', sportTags: ['Cricket'], experienceYears: 10, bio: 'Specialist fast bowling coach. Has trained 5 players who went on to play for state teams.', certifications: ['BCCI Level 2', 'ECB Bowling Coach'] },
      { id: 'coach_003', academyId: 'academy_kickstart', name: 'Pedro Fernandez', photo: 'https://i.pravatar.cc/150?img=13', sportTags: ['Football'], experienceYears: 12, bio: 'UEFA B License holder from Portugal. Expert in tactical formations and youth football development.', certifications: ['AFC B License', 'UEFA B License'] },
      { id: 'coach_004', academyId: 'academy_kickstart', name: 'Suresh Babu', photo: 'https://i.pravatar.cc/150?img=14', sportTags: ['Football'], experienceYears: 8, bio: 'Former ISL academy player. Specializes in goalkeeping and defensive drills.', certifications: ['AIFF D License', 'AFC Youth Coach'] },
      { id: 'coach_005', academyId: 'academy_aquazone', name: 'Anita Sharma', photo: 'https://i.pravatar.cc/150?img=15', sportTags: ['Swimming'], experienceYears: 14, bio: 'National-level swimmer (1998-2008). Specializes in freestyle and butterfly strokes. Has trained 3 national medalists.', certifications: ['SAI Level 3', 'FINA Certified', 'SFI Master Coach'] },
      { id: 'coach_006', academyId: 'academy_aquazone', name: 'James Rodrigues', photo: 'https://i.pravatar.cc/150?img=16', sportTags: ['Swimming'], experienceYears: 9, bio: 'Competitive swimming coach specializing in breaststroke and backstroke. Masters in Sports Science.', certifications: ['SAI Level 2', 'AUSTA Certified'] },
      { id: 'coach_007', academyId: 'academy_courtside', name: 'Leena Kapoor', photo: 'https://i.pravatar.cc/150?img=17', sportTags: ['Tennis', 'Badminton'], experienceYears: 11, bio: 'AITA-ranked player for 8 years. Dual certified in both tennis and badminton coaching.', certifications: ['AITA Certified', 'BWF Level 2'] },
      { id: 'coach_008', academyId: 'academy_courtside', name: 'Ramesh Naidu', photo: 'https://i.pravatar.cc/150?img=18', sportTags: ['Tennis'], experienceYears: 7, bio: 'ITF-certified tennis coach. Specializes in serve mechanics and match strategy for competitive players.', certifications: ['ITF Level 2', 'AITA High Performance'] },
      { id: 'coach_009', academyId: 'academy_allstars', name: 'Deepak Verma', photo: 'https://i.pravatar.cc/150?img=19', sportTags: ['Cricket', 'Athletics'], experienceYears: 13, bio: 'Multi-sport coach with expertise in cricket and track & field. Former state-level athlete.', certifications: ['BCCI Level 2', 'AFI Certified'] },
      { id: 'coach_010', academyId: 'academy_allstars', name: 'Monika Singh', photo: 'https://i.pravatar.cc/150?img=20', sportTags: ['Basketball', 'Football'], experienceYears: 6, bio: 'Ex-BFI basketball player. Brings a competitive-sport perspective to youth training programs.', certifications: ['BFI Level 2', 'AIFF D License'] },
      { id: 'coach_011', academyId: 'academy_gachibowli', name: 'Srinivas Reddy', photo: 'https://i.pravatar.cc/150?img=21', sportTags: ['Athletics'], experienceYears: 16, bio: 'Former national 400m champion (2004–2012). SAI Level 3 certified athletics coach specializing in sprints, hurdles, and relay training. Has coached 8 athletes to national competitions.', certifications: ['SAI Level 3', 'AFI Elite Coach', 'IAAF Level 2'] },
      { id: 'coach_012', academyId: 'academy_gachibowli', name: 'Ramakrishna Rao', photo: 'https://i.pravatar.cc/150?img=22', sportTags: ['Athletics'], experienceYears: 12, bio: 'Specialist in field events — long jump, triple jump, shot put, and discus. State-record holder in long jump (2005). Passionate about developing young talent in throwing and jumping disciplines.', certifications: ['AFI Certified', 'SAI Level 2', 'Sports Science Diploma'] },
    ],
  })

  console.log('✅ Created 12 coaches')

  // ─── Transport Routes ─────────────────────────────────────────────────────
  await prisma.transportRoute.createMany({
    skipDuplicates: true,
    data: [
      { id: 'route_champ', academyId: 'academy_champions', vehicleId: 'VH-001', driverId: 'DRV-001', driverName: 'Ramesh Kumar', driverPhone: '+919876543210', vehicleNumber: 'TS09EA1234', vehicleType: 'Van' },
      { id: 'route_kick', academyId: 'academy_kickstart', vehicleId: 'VH-002', driverId: 'DRV-002', driverName: 'Suresh Reddy', driverPhone: '+919876543211', vehicleNumber: 'TS10FB5678', vehicleType: 'Bus' },
      { id: 'route_court', academyId: 'academy_courtside', vehicleId: 'VH-003', driverId: 'DRV-003', driverName: 'Mahesh Rao', driverPhone: '+919876543212', vehicleNumber: 'TS07GC9012', vehicleType: 'Van' },
      { id: 'route_gachi', academyId: 'academy_gachibowli', vehicleId: 'VH-004', driverId: 'DRV-004', driverName: 'Naresh Goud', driverPhone: '+919876543213', vehicleNumber: 'TS11HD3456', vehicleType: 'Bus' },
    ],
  })

  console.log('✅ Created 4 transport routes')

  // ─── Sport Programs ───────────────────────────────────────────────────────
  const programs = await Promise.all([
    // Champions Cricket — 3 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_cricket_junior' }, update: {}, create: { id: 'prog_cricket_junior', academyId: 'academy_champions', sportType: 'Cricket', name: 'Junior Cricket (U-14)', description: 'Foundational cricket program covering batting, bowling, and fielding for young players aged 8-14.', ageGroupMin: 8, ageGroupMax: 14, feeMonthly: 2500, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_cricket_senior' }, update: {}, create: { id: 'prog_cricket_senior', academyId: 'academy_champions', sportType: 'Cricket', name: 'Senior Cricket (15+)', description: 'Advanced cricket training for serious players targeting state-level competitions.', ageGroupMin: 15, ageGroupMax: 30, feeMonthly: 3500, durationMonths: 6 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_cricket_weekend' }, update: {}, create: { id: 'prog_cricket_weekend', academyId: 'academy_champions', sportType: 'Cricket', name: 'Weekend Warriors', description: 'Weekend-only cricket program for working professionals and recreational players.', ageGroupMin: 18, ageGroupMax: 50, feeMonthly: 1500, durationMonths: 1 } }),
    // KickStart Football — 3 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_football_u12' }, update: {}, create: { id: 'prog_football_u12', academyId: 'academy_kickstart', sportType: 'Football', name: 'Football U-12', description: 'Technical skills, dribbling, and passing fundamentals for young footballers.', ageGroupMin: 6, ageGroupMax: 12, feeMonthly: 2000, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_football_u18' }, update: {}, create: { id: 'prog_football_u18', academyId: 'academy_kickstart', sportType: 'Football', name: 'Elite Football U-18', description: 'Tactical and physical development for aspiring competitive footballers.', ageGroupMin: 13, ageGroupMax: 18, feeMonthly: 3000, durationMonths: 6 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_football_adult' }, update: {}, create: { id: 'prog_football_adult', academyId: 'academy_kickstart', sportType: 'Football', name: 'Adult Football League', description: 'Structured training and weekly matches for adult football enthusiasts.', ageGroupMin: 18, ageGroupMax: 45, feeMonthly: 2500, durationMonths: 1 } }),
    // AquaZone Swimming — 3 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_swim_beginner' }, update: {}, create: { id: 'prog_swim_beginner', academyId: 'academy_aquazone', sportType: 'Swimming', name: 'Beginner Swimming', description: 'Water safety and fundamental stroke techniques for non-swimmers and beginners.', ageGroupMin: 4, ageGroupMax: 60, feeMonthly: 2800, durationMonths: 1 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_swim_intermediate' }, update: {}, create: { id: 'prog_swim_intermediate', academyId: 'academy_aquazone', sportType: 'Swimming', name: 'Competitive Swimming', description: 'All four strokes with turns, starts, and competitive race strategy.', ageGroupMin: 8, ageGroupMax: 25, feeMonthly: 3500, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_swim_fitness' }, update: {}, create: { id: 'prog_swim_fitness', academyId: 'academy_aquazone', sportType: 'Swimming', name: 'Aqua Fitness', description: 'Water aerobics and fitness swimming for adults focused on health and wellness.', ageGroupMin: 20, ageGroupMax: 65, feeMonthly: 2200, durationMonths: 1 } }),
    // CourtSide Racquet — 2 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_tennis_junior' }, update: {}, create: { id: 'prog_tennis_junior', academyId: 'academy_courtside', sportType: 'Tennis', name: 'Junior Tennis', description: 'AITA-curriculum tennis training for children with focus on groundstrokes and footwork.', ageGroupMin: 6, ageGroupMax: 16, feeMonthly: 3000, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_badminton' }, update: {}, create: { id: 'prog_badminton', academyId: 'academy_courtside', sportType: 'Badminton', name: 'Badminton Coaching', description: 'BWF-certified coaching covering all shots, footwork patterns, and match play.', ageGroupMin: 8, ageGroupMax: 40, feeMonthly: 2500, durationMonths: 3 } }),
    // AllStars Multi-Sport — 4 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_basketball' }, update: {}, create: { id: 'prog_basketball', academyId: 'academy_allstars', sportType: 'Basketball', name: 'Basketball Training', description: 'Dribbling, shooting, and team play for basketball enthusiasts of all levels.', ageGroupMin: 10, ageGroupMax: 30, feeMonthly: 2200, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_athletics' }, update: {}, create: { id: 'prog_athletics', academyId: 'academy_allstars', sportType: 'Athletics', name: 'Track & Field', description: 'Sprint training, long jump, and throws coaching by AFI-certified coaches.', ageGroupMin: 10, ageGroupMax: 25, feeMonthly: 1800, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_multi_weekend' }, update: {}, create: { id: 'prog_multi_weekend', academyId: 'academy_allstars', sportType: 'Cricket', name: 'Weekend Multi-Sport', description: 'Saturday cricket, Sunday football — perfect weekend activity for school children.', ageGroupMin: 7, ageGroupMax: 16, feeMonthly: 1800, durationMonths: 1 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_football_allstars' }, update: {}, create: { id: 'prog_football_allstars', academyId: 'academy_allstars', sportType: 'Football', name: 'AllStars Football', description: 'Structured football program with match practice and tactical training.', ageGroupMin: 8, ageGroupMax: 20, feeMonthly: 2000, durationMonths: 3 } }),
    // Gachibowli Stadium Athletics — 3 programs
    prisma.sportProgram.upsert({ where: { id: 'prog_gachi_sprint' }, update: {}, create: { id: 'prog_gachi_sprint', academyId: 'academy_gachibowli', sportType: 'Athletics', name: 'Sprint & Speed Training', description: 'Intensive sprint training on Gachibowli\'s 400m synthetic track. Covers 100m, 200m, 400m technique, block starts, and relay exchanges under coach Srinivas Reddy.', ageGroupMin: 10, ageGroupMax: 28, feeMonthly: 3200, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_gachi_field' }, update: {}, create: { id: 'prog_gachi_field', academyId: 'academy_gachibowli', sportType: 'Athletics', name: 'Field Events Elite', description: 'Specialised coaching in long jump, triple jump, shot put, discus, and javelin. Coach Ramakrishna Rao uses biomechanics video analysis for technical improvement.', ageGroupMin: 12, ageGroupMax: 30, feeMonthly: 2800, durationMonths: 3 } }),
    prisma.sportProgram.upsert({ where: { id: 'prog_gachi_junior' }, update: {}, create: { id: 'prog_gachi_junior', academyId: 'academy_gachibowli', sportType: 'Athletics', name: 'Junior Athletics (U-14)', description: 'Foundation athletics program for school-age children. Fun-based conditioning, multi-event exposure, and AFI-syllabus grading. Transport pickup available across Gachibowli & Kondapur.', ageGroupMin: 8, ageGroupMax: 14, feeMonthly: 2000, durationMonths: 3 } }),
  ])

  console.log(`✅ Created ${programs.length} sport programs`)

  // ─── Slots ────────────────────────────────────────────────────────────────
  await prisma.slot.createMany({
    skipDuplicates: true,
    data: [
      // Champions Cricket — Junior
      { id: 'slot_champ_j_m1', programId: 'prog_cricket_junior', timeStart: '05:30', timeEnd: '06:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 20, enrolledCount: 14 },
      { id: 'slot_champ_j_m2', programId: 'prog_cricket_junior', timeStart: '06:30', timeEnd: '07:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 20, enrolledCount: 8 },
      { id: 'slot_champ_j_e1', programId: 'prog_cricket_junior', timeStart: '16:00', timeEnd: '17:00', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 20, enrolledCount: 18 },
      // Champions Cricket — Senior
      { id: 'slot_champ_s_m1', programId: 'prog_cricket_senior', timeStart: '06:00', timeEnd: '07:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 15, enrolledCount: 10 },
      { id: 'slot_champ_s_e1', programId: 'prog_cricket_senior', timeStart: '17:00', timeEnd: '18:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 15, enrolledCount: 12 },
      // Champions Cricket — Weekend
      { id: 'slot_champ_w1', programId: 'prog_cricket_weekend', timeStart: '07:00', timeEnd: '09:00', daysOfWeek: ['Sat', 'Sun'], totalCapacity: 25, enrolledCount: 15 },
      // KickStart Football — U12
      { id: 'slot_kick_u12_m1', programId: 'prog_football_u12', timeStart: '07:00', timeEnd: '08:00', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 20, enrolledCount: 16 },
      { id: 'slot_kick_u12_e1', programId: 'prog_football_u12', timeStart: '16:30', timeEnd: '17:30', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 20, enrolledCount: 11 },
      // KickStart Football — U18
      { id: 'slot_kick_u18_m1', programId: 'prog_football_u18', timeStart: '06:00', timeEnd: '07:30', daysOfWeek: ['Mon', 'Wed', 'Fri', 'Sat'], totalCapacity: 18, enrolledCount: 14 },
      { id: 'slot_kick_u18_e1', programId: 'prog_football_u18', timeStart: '17:00', timeEnd: '18:30', daysOfWeek: ['Tue', 'Thu'], totalCapacity: 18, enrolledCount: 9 },
      // AquaZone — Beginner
      { id: 'slot_swim_beg_m1', programId: 'prog_swim_beginner', timeStart: '06:00', timeEnd: '07:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 12, enrolledCount: 10 },
      { id: 'slot_swim_beg_m2', programId: 'prog_swim_beginner', timeStart: '07:00', timeEnd: '08:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 12, enrolledCount: 7 },
      { id: 'slot_swim_beg_e1', programId: 'prog_swim_beginner', timeStart: '18:00', timeEnd: '19:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 12, enrolledCount: 12 },
      // AquaZone — Competitive
      { id: 'slot_swim_comp_m1', programId: 'prog_swim_intermediate', timeStart: '05:30', timeEnd: '07:00', daysOfWeek: ['Mon', 'Wed', 'Fri', 'Sat'], totalCapacity: 10, enrolledCount: 8 },
      // CourtSide — Tennis Junior
      { id: 'slot_tennis_j_m1', programId: 'prog_tennis_junior', timeStart: '07:00', timeEnd: '08:00', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 8, enrolledCount: 6 },
      { id: 'slot_tennis_j_e1', programId: 'prog_tennis_junior', timeStart: '16:00', timeEnd: '17:00', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 8, enrolledCount: 7 },
      // CourtSide — Badminton
      { id: 'slot_badminton_m1', programId: 'prog_badminton', timeStart: '06:30', timeEnd: '07:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 10, enrolledCount: 5 },
      { id: 'slot_badminton_e1', programId: 'prog_badminton', timeStart: '17:30', timeEnd: '18:30', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 10, enrolledCount: 8 },
      // AllStars — Basketball
      { id: 'slot_basket_m1', programId: 'prog_basketball', timeStart: '07:00', timeEnd: '08:00', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 15, enrolledCount: 10 },
      { id: 'slot_basket_e1', programId: 'prog_basketball', timeStart: '17:00', timeEnd: '18:00', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 15, enrolledCount: 13 },
      // AllStars — Athletics
      { id: 'slot_athletics_m1', programId: 'prog_athletics', timeStart: '06:00', timeEnd: '07:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 20, enrolledCount: 12 },
      // AllStars — Weekend Multi
      { id: 'slot_multi_w1', programId: 'prog_multi_weekend', timeStart: '08:00', timeEnd: '10:00', daysOfWeek: ['Sat'], totalCapacity: 30, enrolledCount: 18 },
      { id: 'slot_multi_w2', programId: 'prog_multi_weekend', timeStart: '08:00', timeEnd: '10:00', daysOfWeek: ['Sun'], totalCapacity: 30, enrolledCount: 22 },
      // KickStart — Adult football
      { id: 'slot_adult_football_e1', programId: 'prog_football_adult', timeStart: '19:00', timeEnd: '20:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 22, enrolledCount: 16 },
      // AllStars — Football
      { id: 'slot_allstars_fb_m1', programId: 'prog_football_allstars', timeStart: '07:30', timeEnd: '08:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 18, enrolledCount: 9 },
      // Gachibowli Stadium — Sprint & Speed
      { id: 'slot_gachi_sprint_m1', programId: 'prog_gachi_sprint', timeStart: '05:30', timeEnd: '07:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 16, enrolledCount: 11 },
      { id: 'slot_gachi_sprint_e1', programId: 'prog_gachi_sprint', timeStart: '17:00', timeEnd: '18:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], totalCapacity: 16, enrolledCount: 13 },
      // Gachibowli Stadium — Field Events
      { id: 'slot_gachi_field_m1', programId: 'prog_gachi_field', timeStart: '06:00', timeEnd: '07:30', daysOfWeek: ['Mon', 'Wed', 'Fri', 'Sat'], totalCapacity: 12, enrolledCount: 8 },
      { id: 'slot_gachi_field_e1', programId: 'prog_gachi_field', timeStart: '16:30', timeEnd: '18:00', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 12, enrolledCount: 5 },
      // Gachibowli Stadium — Junior Athletics
      { id: 'slot_gachi_junior_m1', programId: 'prog_gachi_junior', timeStart: '06:30', timeEnd: '07:30', daysOfWeek: ['Mon', 'Wed', 'Fri'], totalCapacity: 20, enrolledCount: 15 },
      { id: 'slot_gachi_junior_e1', programId: 'prog_gachi_junior', timeStart: '16:00', timeEnd: '17:00', daysOfWeek: ['Tue', 'Thu', 'Sat'], totalCapacity: 20, enrolledCount: 9 },
    ],
  })

  console.log('✅ Created 31 slots')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Test credentials:')
  console.log('   User:  user@sportshub.com / +919999999999')
  console.log('   Admin: admin1@sportshub.com / +918888888881')
  console.log('   OTP:   any 6 digits (dev mode)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
