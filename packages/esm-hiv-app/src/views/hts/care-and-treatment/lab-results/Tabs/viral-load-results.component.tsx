/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';

import styles from './patient-list.scss';
import { useTranslation } from 'react-i18next';
import { age, navigate, openmrsFetch } from '@openmrs/esm-framework';
import { DataTableSkeleton, Pagination} from 'carbon-components-react';
import { capitalize } from 'lodash';
import {
  EmptyState,
  OTable,
  fetchPatientList,
  encounterRepresentation,
  getObsFromEncounter,
  fetchLastVisit,
} from 'openmrs-esm-ohri-commons-lib';
import { ViralLoadResultDate_UUID, ViralLoadResultsEncounter_UUID, ViralLoadResult_UUID } from '../../../../../constants';

interface ViralLoadResultsListProps {
  patientUuid: string;
}
interface ViralLoadValues {
    LastViralLoadResult: string;
    LastViralLoadResultDate: string;

}

const ViralLoadResultsList: React.FC<ViralLoadResultsListProps> = () => {
  const { t } = useTranslation();
  const [patients, setTableRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowCount = 5;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPatientCount, setPatientCount] = useState(0);
  const [nextOffSet, setNextOffSet] = useState(0);
  const headerTitle = 'Viral Load Results';
  const tableHeaders = [
    { key: 'name', header: 'Patient Name', isSortable: true },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Sex' },
    { key: 'viralLoadResult', header: 'Most Recent Viral Load Results' },
    { key: 'viralLoadResultDate', header: 'Viral Load Results Date' },
    { key: 'actions', header: '' },
  ];

  useEffect(() => {
    if (!page) setIsLoading(true);
    loadPatients(nextOffSet, pageSize);
  }, [page, pageSize]);
  
  const addNewPatient = () => navigate({ to: '${openmrsSpaBase}/patient-registration' });

  async function fetchPatientLastViralEncounters(patientUuid:string) {
    let latestViralEncounter = {
        result: '--',
        date: '--'
    };
    const query = `encounterType=${ViralLoadResultsEncounter_UUID}&patient=${patientUuid}`;
    const viralResults = await openmrsFetch(`/ws/rest/v1/encounter?${query}&v=${encounterRepresentation}`);
    if(viralResults.data.results?.length > 0){
        const sortedEncounters = viralResults.data.results.sort(
            (firstEncounter, secondEncounter) =>
              new Date(secondEncounter.encounterDatetime).getTime() -
              new Date(firstEncounter.encounterDatetime).getTime(),
          );
        const lastEncounter = sortedEncounters[0];

        latestViralEncounter.result = getObsFromEncounter(lastEncounter, ViralLoadResult_UUID);             
        latestViralEncounter.date = getObsFromEncounter(lastEncounter, ViralLoadResultDate_UUID,true);

        } 
        return latestViralEncounter;    
  }

  async function loadPatients(offSet: number, pageSize: number) {
    let rows = [];
    const { data: patients } = await fetchPatientList(offSet, pageSize);

    setPatientCount(patients.total);
    let lastViralLoadResult: string;
    let lastViralLoadResultDate: string;

    for (let patient of patients.entry) {
        let i = 0;
        const { data } = await fetchLastVisit(patient.resource.id);
        fetchPatientLastViralEncounters(patient.resource.id).then(data => {
            i += 1;
            console.log(`${i}. ${data.result}`);
            lastViralLoadResult = data.result;
            lastViralLoadResultDate = data.date;
        })

    //     const patientViralLoadPromises = patientIdArray.map(patientId => {
    //     const query = `encounterType=${ViralLoadResultsEncounter_UUID}&patient=${patientId}`;
    //     return openmrsFetch(`/ws/rest/v1/encounter?${query}&v=${encounterRepresentation}`);
    //   });
    //   Promise.all(patientViralLoadPromises).then(values => {
    //       values.forEach(({data}, index) => {
    //           if(data.results?.length > 0){
    //             const sortedEncounters = data.results.sort(
    //                 (firstEncounter, secondEncounter) =>
    //                   new Date(secondEncounter.encounterDatetime).getTime() -
    //                   new Date(firstEncounter.encounterDatetime).getTime(),
    //               );
    //             const lastEncounter = sortedEncounters[0];
    //             lastViralLoadResult = getObsFromEncounter(lastEncounter, ViralLoadResult_UUID);             
    //             lastViralLoadResultDate = getObsFromEncounter(lastEncounter, ViralLoadResultDate_UUID,true);
    //             //console.log(`VIRAL: ${patient.resource.name[0].given.join(' ')} ${patient.resource.name[0].family}. ${lastViralLoadResult}`);
    //           }
    //       });
    //   });

      rows.push({
        id: patient.resource.id,
        name: `${patient.resource.name[0].given.join(' ')} ${patient.resource.name[0].family}`,
        age: age(patient.resource.birthDate),
        gender: capitalize(patient.resource.gender),
        viralLoadResult: lastViralLoadResult,
        viralLoadResultDate: lastViralLoadResultDate,
      });
    }
    setTableRows(rows);
    setIsLoading(false);
  }
  return (
    <>
      {isLoading ? (
        <DataTableSkeleton rowCount={rowCount} />
      ) : patients.length > 0 ? (
        <div className={styles.widgetContainer}>
          <div className={styles.widgetHeaderContainer}>
            <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          </div>
          <OTable tableHeaders={tableHeaders} tableRows={patients} />
          <div style={{ width: '800px' }}>
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={[10, 20, 30, 40, 50]}
              totalItems={totalPatientCount}
              onChange={({ page, pageSize }) => {
                setNextOffSet(page * pageSize + 1);
                setPage(page);
                setPageSize(pageSize);
              }}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          displayText={t('patientList', 'patient list')}
          headerTitle={headerTitle}
          launchForm={addNewPatient}
        />
      )}
    </>
  );
};

export default ViralLoadResultsList;
