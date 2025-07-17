import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  Image,
  Select,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import Usa from 'assets/img/dashboards/usa.png';
import MiniCalendar from 'components/calendar/MiniCalendar';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import React from 'react';
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
} from 'react-icons/md';
import CheckTable from 'views/admin/default/components/CheckTable';
import ComplexTable from 'views/admin/default/components/ComplexTable';
import DailyTraffic from 'views/admin/default/components/DailyTraffic';
import PieCard from 'views/admin/default/components/PieCard';
import Tasks from 'views/admin/default/components/Tasks';
import WeeklyRevenue from 'views/admin/default/components/WeeklyRevenue';
import {
  columnsDataCheck,
  columnsDataComplex,
} from 'views/admin/default/variables/columnsData';
import tableDataCheck from 'views/admin/default/variables/tableDataCheck.json';
import tableDataComplex from 'views/admin/default/variables/tableDataComplex.json';
import TotalSpent from 'views/admin/default/components/TotalSpent';
import { useQuery } from 'react-query';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function UserReports() {
  const { account, signAndSubmitTransaction } = useWallet();
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const [history, setHistory] = React.useState([]);
  const fetchTxHistory = useQuery(
    'fetchTxHistory',
    async () => {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/transactions?userId=${account?.address.toString()}`,
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setHistory(data);
      return data;
    },
    {
      refetchInterval: 10000,
      onError: (error) => {
        console.error('Error fetching transaction history:', error);
      },
    },
  );

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, '2xl': 3 }} gap="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Image src="/assets/Aptos_mark_BLK.png" w="32px" h="32px" />
              }
            />
          }
          name="Aptos Balance"
          value="$350.4"
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon w="32px" h="32px" as={MdAttachMoney} color={brandColor} />
              }
            />
          }
          name="Spend this month"
          value="$642.39"
        />
        <MiniStatistics growth="+23%" name="Sales" value="$574.34" />
      </SimpleGrid>

      <SimpleGrid
        columns={{ base: 1, md: 2, xl: 1 }}
        gap="20px"
        mb="20px"
      ></SimpleGrid>
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={tableDataComplex}
        historyData={history}
        query={fetchTxHistory}
      />
    </Box>
  );
}
