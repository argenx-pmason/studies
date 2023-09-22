%macro pc ;
   %if &sysscp=WIN %then %do ;
      %global _SASWS_;
      %let _SASWS_=C:\lsaf\files; %* for running on PC SAS ;
      DM 'CLE LOG; CLE OUT';
   %end ;
%mend pc ;
%pc;

LIBNAME status "&_SASWS_/general/biostat/metadata/projects" inencoding='utf-8';
proc copy in=status out=work ; select studies_info ; run ;

data default_key_dates(keep=id study indication ae_refresh adsl_refresh EOS LstCnd first_ICF FPFV LPLV status subjects);
   id=put(_n_,z8.);
   set studies_info ;
   length ae_refresh adsl_refresh EOS LstCnd $10 ;
   if missing(sdtm_ae_refresh_date) then ae_refresh=''; else ae_refresh=put(sdtm_ae_refresh_date,yymmdd10.);
   if missing(adsl_refresh_date) then adsl_refresh='';else adsl_refresh=put(adsl_refresh_date,yymmdd10.);
   if missing(eosdt) then EOS='';else EOS=put(eosdt,yymmdd10.);
   if missing(lstcndt) then LstCnd='';else LstCnd=put(lstcndt,yymmdd10.);
   subjects=No_of_subjects_treated;
   study=upcase(ifc(studyid>' ',studyid,study));
   first_ICF=First_ICF_date;
run ;

filename out "&_sasws_/general/biostat/metadata/projects/rm/default_key_dates.json";
proc json out=out pretty nosastags ;
     write open array;
         export default_key_dates;
     write close;   
run;

* read in existing key dates ;
libname in json "&_sasws_/general/biostat/metadata/projects/rm/key_dates.json";
data key_dates(drop=ordinal_root) ;
   set in.root ;
   study=upcase(study);
run ;
proc sort data=key_dates ;
   by study ;
run ;

* save previous key dates ;
filename out "&_sasws_/general/biostat/metadata/projects/rm/previous_key_dates.json";
proc json out=out pretty nosastags ;
     write open array;
         export key_dates;
     write close;  
run;

* merge new data with existing key dates ;
proc sort data=default_key_dates ;
   by study ;
run ;
data merged ;
   merge key_dates default_key_dates ;
      by study ;
run ;

filename out "&_sasws_/general/biostat/metadata/projects/rm/key_dates.json";
proc json out=out pretty nosastags ;
     write open array;
         export merged;
     write close;   
run;
