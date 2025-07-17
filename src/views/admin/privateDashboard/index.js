import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  Select,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
// Assets
import Usa from 'assets/img/dashboards/usa.png';
// Custom components
import MiniCalendar from 'components/calendar/MiniCalendar';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import React, { useState } from 'react';
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
} from 'react-icons/md';
import CheckTable from 'views/admin/default/components/CheckTable';
import ComplexTable from 'views/admin/privateDashboard/components/ComplexTable';
import DailyTraffic from 'views/admin/default/components/DailyTraffic';
import PieCard from 'views/admin/default/components/PieCard';
import Tasks from 'views/admin/default/components/Tasks';
import WeeklyRevenue from 'views/admin/default/components/WeeklyRevenue';
import {
  columnsDataCheck,
  columnsDataComplex,
} from 'views/admin/privateDashboard/variables/columnsData';
import tableDataCheck from 'views/admin/default/variables/tableDataCheck.json';
import tableDataComplex from 'views/admin/privateDashboard/variables/tableDataComplex.json';
import TotalSpent from 'views/admin/privateDashboard/components/TotalSpent';
import { useQuery } from 'react-query';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import axios from 'axios';

export default function PrivateDashboard() {
  // Chakra Color Mode
  const { account } = useWallet();
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const [vaultUserBalance, setVaultUserBalance] = useState(null);
  const vaultBalanceQuery = useQuery(
    ['vaultUserBalance'],
    async () => {
      const address = account?.address?.toString();
      if (!address) return 0;
      let url = `${process.env.REACT_APP_API_URL}/api/balance?address=${address}`;
      const res = await axios.get(url);
      setVaultUserBalance(res.data.balance ?? 0)
    },
    { enabled: !!account?.address },
  );
  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <TotalSpent balance={vaultUserBalance} />
      {/* <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, '2xl': 3 }}
        gap="20px"
        mb="20px"
        mt="20px"
      >
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon w="32px" h="32px" as={MdBarChart} color={brandColor} />
              }
            />
          }
          name="Earnings"
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
        
      </SimpleGrid> */}

      <SimpleGrid columns={{ base: 1, md: 2, xl: 1 }} gap="20px" mb="20px">
        {/* <WeeklyRevenue /> */}
        {/* <ChatBox /> */}
      </SimpleGrid>
      {/* <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <DailyTraffic />
          <PieCard />
        </SimpleGrid>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <ComplexTable
          columnsData={columnsDataComplex}
          tableData={tableDataComplex}
        />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <Tasks />
          <MiniCalendar h='100%' minW='100%' selectRange={false} />
        </SimpleGrid>
      </SimpleGrid> */}
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={tableDataComplex}
      />
    </Box>
  );
}
