import { WkButton } from '@motorghar-platform/ui'

export function App() {
  const handleSearch = () => {
    console.log('Searching vehicles...')
  }

  const handleFilter = () => {
    console.log('Opening filters...')
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <header>
        <h1 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
          MotorGhar - Find Your Perfect Vehicle
        </h1>
        <p style={{ color: '#64748b' }}>
          Browse thousands of verified cars and bikes across Nepal
        </p>
      </header>

      <main style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <WkButton
            label="Search Vehicles"
            variant="primary"
            size="large"
            onClick={handleSearch}
          />

          <WkButton
            label="Advanced Filters"
            variant="secondary"
            size="medium"
            onClick={handleFilter}
          />

          <WkButton
            label="Danger Action"
            variant="danger"
            size="small"
            disabled={true}
          />
        </div>
      </main>
    </div>
  )
}