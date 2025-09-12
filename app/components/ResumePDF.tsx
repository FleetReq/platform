import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 50,
    paddingLeft: 50,
    paddingRight: 50,
    paddingBottom: 50,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 30,
    textAlign: 'center'
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  contact: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666666'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: '2 solid #3B82F6',
    color: '#1F2937'
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  company: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
    color: '#4B5563'
  },
  dateRange: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8
  },
  bulletPoint: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 15,
    color: '#374151'
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  skillTag: {
    backgroundColor: '#EBF4FF',
    color: '#1E40AF',
    padding: '4 8',
    borderRadius: 12,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 4
  },
  educationItem: {
    marginBottom: 12
  }
})

const ResumePDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>Bruce Truong</Text>
        <Text style={styles.contact}>Beaverton, OR</Text>
        <Text style={styles.contact}>careers@brucetruong.com | 971.444.8816</Text>
      </View>

      {/* Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EDUCATION</Text>
        
        <View style={styles.educationItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={styles.jobTitle}>Portland State University</Text>
            <Text style={styles.dateRange}>Jan 2015 – Jun 2024</Text>
          </View>
          <Text style={styles.company}>Bachelor of Science - Major in Computer Science, Minor in Philosophy</Text>
          <Text style={styles.jobTitle}>PSU Capstone - Bike Index Platform Team Lead</Text>
          <Text style={styles.bulletPoint}>• Organized and led a 5-member team to create, edit, and search through theft information on the Bike Index Platform</Text>
          <Text style={styles.bulletPoint}>• Collaborated via Scrum methodology to navigate through bi-weekly project sprints</Text>
        </View>

        <View style={styles.educationItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={styles.jobTitle}>Portland Community College</Text>
            <Text style={styles.dateRange}>Jan 2008 – Mar 2023</Text>
          </View>
          <Text style={styles.company}>Associate of Science – Oregon Transfer</Text>
        </View>
      </View>

      {/* Technical Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TECHNICAL SKILLS</Text>
        
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>Programming Languages:</Text>
        <View style={styles.skillsGrid}>
          <Text style={styles.skillTag}>Go</Text>
          <Text style={styles.skillTag}>Python</Text>
          <Text style={styles.skillTag}>Bash</Text>
          <Text style={styles.skillTag}>SQL</Text>
          <Text style={styles.skillTag}>C++</Text>
          <Text style={styles.skillTag}>C</Text>
          <Text style={styles.skillTag}>Rust</Text>
          <Text style={styles.skillTag}>TypeScript</Text>
        </View>

        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6, marginTop: 12 }}>Technologies:</Text>
        <View style={styles.skillsGrid}>
          <Text style={styles.skillTag}>GCP</Text>
          <Text style={styles.skillTag}>Kubernetes</Text>
          <Text style={styles.skillTag}>Docker</Text>
          <Text style={styles.skillTag}>Terraform</Text>
          <Text style={styles.skillTag}>Helm</Text>
          <Text style={styles.skillTag}>Kafka</Text>
          <Text style={styles.skillTag}>RabbitMQ</Text>
          <Text style={styles.skillTag}>IBM MQ</Text>
          <Text style={styles.skillTag}>MongoDB</Text>
          <Text style={styles.skillTag}>PostgreSQL</Text>
          <Text style={styles.skillTag}>DataDog</Text>
          <Text style={styles.skillTag}>GitHub Actions</Text>
          <Text style={styles.skillTag}>Ubuntu</Text>
        </View>
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EXPERIENCE</Text>
        
        {/* Apex Fintech */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.jobTitle}>Apex Fintech Solutions</Text>
              <Text style={styles.company}>Site Reliability Engineer</Text>
            </View>
            <Text style={styles.dateRange}>Jan 2024 - Present</Text>
          </View>
          <Text style={styles.bulletPoint}>• Engineered bash automation scripts for production MongoDB migration, successfully migrating filtered digital assets collection containing 60 billion documents from on-premise infrastructure to Atlas cloud services, including comprehensive testing, documentation, and team training</Text>
          <Text style={styles.bulletPoint}>• Acquired proficiency in utilizing the Datadog metrics platform for comprehensive monitoring and analysis, enhancing visibility and performance optimization within complex systems</Text>
          <Text style={styles.bulletPoint}>• Refactoring code for simplicity and readability, including usage of code coverage tools as a guide to writing more comprehensive tests</Text>
        </View>

        {/* Trimble */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.jobTitle}>Trimble</Text>
              <Text style={styles.company}>Software Engineer Intern</Text>
            </View>
            <Text style={styles.dateRange}>Jul 2023 - Dec 2023</Text>
          </View>
          <Text style={styles.bulletPoint}>• Successfully fulfilled dual roles as a Developer and Quality Assurance professional, ensuring high-quality software delivery through meticulous testing and development practices</Text>
          <Text style={styles.bulletPoint}>• Proficiently utilized SQL Server Management Studio (SSMS) for database management, T-SQL for querying and manipulation, and developed forms using C# and VB</Text>
          <Text style={styles.bulletPoint}>• Demonstrated expertise in code and task management using Azure DevOps (AZDO), Azure, and Git, facilitating streamlined development processes and collaboration</Text>
        </View>

        {/* Teaching */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.jobTitle}>Holy Trinity Catholic School</Text>
              <Text style={styles.company}>Math/Coding/Photography Instructor</Text>
            </View>
            <Text style={styles.dateRange}>Sep 2018 - Jan 2022</Text>
          </View>
          <Text style={styles.bulletPoint}>• Improved and trained staff with recent mathematic learning strategies</Text>
          <Text style={styles.bulletPoint}>• Supported staff with technology hardware, software, telecommunications, and peripheral systems</Text>
          <Text style={styles.bulletPoint}>• Established the coding and photography curriculum</Text>
          <Text style={styles.bulletPoint}>• Evaluated software and hardware requirements and recommended purchases for the institution</Text>
        </View>
      </View>
    </Page>
  </Document>
)

export default ResumePDF