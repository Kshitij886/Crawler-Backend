import React from 'react';
import {Card, QuickAction, Badge, Pill, Progess} from '../components/forImport';

function DashboardView() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
      <div className='lg:col-span-8 space-y-5'>
        <Card title = {'Quick Start'} 
        subtitle = {'Upload domains, monitor crawl progress, and export qualified leads.'}
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <QuickAction 
            title = {'Update Domains'}
            subtitle = {'CSV, TXT, or paste list'}
            icon = {'⬆️'}
            />
            <QuickAction
            title = {'Start Crawl'}
            subtitle = {'Queue & schedule'}
            icon = {'🕸️'}
            />
            <QuickAction 
            title = {'Export Leads'}
            subtitle = {'CSV/Sheets/CRM'}
            icon = {'📥'}
            />
          </div>
        </Card>
        <Card 
        title = {'Recent Crawls'}
        subtitle = {'Latest batches with status and completion rate.'}
        >
          

        </Card>

      </div>
      
    </div>
  )
}

export default DashboardView
