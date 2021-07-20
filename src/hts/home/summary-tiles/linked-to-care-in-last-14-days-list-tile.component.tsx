import { age, attach, ExtensionSlot } from '@openmrs/esm-framework';
import { capitalize } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTodayClients } from '../../../api/api';
import EmptyState from '../../../components/empty-state/empty-state.component';
import { filterFHIRPatientsByName } from '../../../hts-home/patient-list.component';

const basePath = '${openmrsSpaBase}/patient/';
export const columns = [
  {
    key: 'name',
    header: 'Name',
    getValue: patient => {
      return `${patient.name[0].given.join(' ')} ${patient.name[0].family}`;
    },
    link: {
      getUrl: patient => `${basePath}${patient.id}/chart`,
    },
  },
  {
    key: 'gender',
    header: 'Sex',
    getValue: patient => {
      return capitalize(patient.gender);
    },
  },
  {
    key: 'age',
    header: 'Age',
    getValue: patient => {
      return age(patient.birthDate);
    },
  },
  {
    key: 'lastVisit',
    header: 'Last Visit',
    getValue: patient => {
      return 'TODO';
    },
  },
  {
    key: 'id',
    header: 'Patient ID',
    getValue: patient => {
      return patient.identifier[0].value;
    },
  },
];
export const LinkedToCareInLast14Days: React.FC<{}> = () => {
  const [patients, setPatients] = useState([]);
  const [totalPatientCount, setTotalPatientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(null);
  const [counter, setCounter] = useState(0);
  const [filteredResults, setFilteredResults] = useState([]);
  const [filteredResultsCounts, setFilteredResultsCounts] = useState(0);

  useEffect(() => {
    fetchTodayClients().then((response: Array<any>) => {
      setPatients(response.map(pat => pat.data));
      setTotalPatientCount(response.length);
      setIsLoading(false);
    });
  }, [pageSize, currentPage]);

  useEffect(() => {
    attach('today-clients-table-slot', 'patient-table');
  }, []);

  const pagination = useMemo(() => {
    return {
      usePagination: true,
      currentPage: currentPage,
      onChange: props => {
        setCurrentPage(props.page);
        setPageSize(props.pageSize);
      },
      pageSize: pageSize,
      totalItems: searchTerm ? filteredResultsCounts : totalPatientCount,
    };
  }, [currentPage, filteredResultsCounts, pageSize, totalPatientCount, searchTerm]);

  const handleSearch = useCallback(
    searchTerm => {
      setSearchTerm(searchTerm);
      if (searchTerm) {
        const filtrate = filterFHIRPatientsByName(searchTerm, patients);
        setFilteredResults(filtrate);
        setFilteredResultsCounts(filtrate.length);
      }
    },
    [patients],
  );

  const state = useMemo(
    () => ({
      patients: searchTerm ? filteredResults : patients,
      columns,
      search: { placeHolder: 'Search patient list', onSearch: handleSearch, currentSearchTerm: searchTerm },
      pagination,
      isLoading,
      autoFocus: true,
    }),
    [searchTerm, filteredResults, patients, handleSearch, pagination, isLoading],
  );

  useEffect(() => {
    setCounter(counter + 1);
  }, [state]);

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      {!isLoading && !patients.length ? (
        <EmptyState headerTitle="Linked To Care in Last 14 Days" displayText="patients" newResource={false} />
      ) : (
        <ExtensionSlot extensionSlotName="today-clients-table-slot" state={state} key={counter} />
      )}
    </div>
  );
};
